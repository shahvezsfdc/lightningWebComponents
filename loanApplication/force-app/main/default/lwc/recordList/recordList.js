/* eslint-disable no-console */
import { LightningElement, api, track, wire } from "lwc";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import { getPicklistValues } from "lightning/uiObjectInfoApi";
import { getObjectInfo } from "lightning/uiObjectInfoApi";
import { getRecord, getFieldValue } from 'lightning/uiRecordApi';
import { NavigationMixin } from 'lightning/navigation';
import getAllInvestors from "@salesforce/apex/LWCBondBuyUtility.getAllInvestors";
import createBondBuys from "@salesforce/apex/LWCBondBuyUtility.createBondBuys";
import getAllInvestorsBuys from "@salesforce/apex/LWCBondBuyUtility.getAllInvestorsBuys";
import BOND_OFFERING_OBJECT from "@salesforce/schema/Bond_Offering__c";
import BOND_BUY_OBJECT from "@salesforce/schema/Bond_Buy__c";
import INVESTOR_OBJECT from "@salesforce/schema/Investor__c";
import BOND_OFFERING_NAME_FIELD from "@salesforce/schema/Bond_Offering__c.Name";
import INVESTOR_TYPE_FIELD from "@salesforce/schema/Investor__c.Type__c";
import ID from "@salesforce/schema/Bond_Buy__c.Id";
import UNITS from "@salesforce/schema/Bond_Buy__c.Units__c";
import STATUS from "@salesforce/schema/Bond_Buy__c.Status__c";
import BOND_BUY_INVESTOR_NAME from "@salesforce/schema/Bond_Buy__c.Investor__c";
import BOND_BUY_BOND_OFFERING_ID from "@salesforce/schema/Bond_Buy__c.Bond_Offering__c";

export default class createBondOffering extends NavigationMixin(LightningElement) {

    @track client;
    @track selectedInvestorType = 'any';
    @track investorsByType;
    @track error;
    @track error;
    @track data;
    @track selectedRow;
    @track rowInvestorId;
    @track bondBuyUnits;
    @track bondBuyId;
    @track investorName;
    @track investorType;
    @track bondBuyPerBO;
    @track bondOfferingName;
    @track investorIdForBOEdit;
    @track investorIdFromChildRow;
    @track isUncheck;
    @track isRecordPresent = false;
    @track hasRendered = false;
    @track currentPageAfterRowSelect;
    @track rowData;
    @track checked;
    pageData = [];
    @api editBondBuy = false;
    selectedRowIdsArray = [];
    selectedRowCheckBoxArray = [];
    selectedRowUnitsArray = [];
    selectedRowStatusArray = [];
    checkedRecordArray = [];
    unitsMap = new Map();
    statusMap = new Map();
    idMap = new Map();
    checkBoxMap = new Map();
    checkedRecordMap = new Map();

    checkedRecord;


    @track bondBuyRecord = {
        Id: ID,
        Units__c: UNITS,
        Status__c: STATUS,
        Investor__c: BOND_BUY_INVESTOR_NAME,
        Bond_Offering__c: BOND_BUY_BOND_OFFERING_ID
    };

    bondBuysList = [];


    @api currentpage;
    @api pagesize = 5;
    @api getIdFromParentOnEdit;

    totalpages;
    localCurrentPage = null;
    displayProgress = false;
    investor = undefined;

    bondOfferingObject = BOND_OFFERING_OBJECT;

    @track startingRecord = 1; //start record position per page
    @track endingRecord = 0;

    @track investorPerPage;

    @track investorBuys;

    @track tableJsonData;

    //@track units;
    //@track status;

    /* Get all the investor to display in a table structure while creating Bond Offering. */
    @wire(getAllInvestors)
    investorsList({ data, error }) {
        if (data) {
            this.investorsByType = data;
            this.totalrecords = data.length;
            this.totalpages = Math.ceil(data.length / this.pagesize);
            this.investorPerPage = this.investorsByType.slice(0, this.pagesize);
            const event = new CustomEvent("recordsload", {
                detail: this.totalrecords
            });
            this.dispatchEvent(event);
            this.error = undefined;
        } else if (error) {
            this.error = error;
            this.investorsByType = undefined;
        }
    }

    /* Get all the investor (with or without Bond Buys) to display in a table structure while editing Bond Offering. */
    @wire(getAllInvestorsBuys, { bondOffering: '$bondOfferingName' })
    investorsBuysList({ data, error }) {
        if (data) {
            this.investorsByType = data;
            this.totalrecords = data.length;
            this.totalpages = Math.ceil(data.length / this.pagesize);
            this.investorPerPage = this.investorsByType.slice(0, this.pagesize);
            const event = new CustomEvent("recordsload", {
                detail: this.totalrecords
            });
            this.dispatchEvent(event);
            this.error = undefined;
        } else if (error) {
            this.error = error;
            this.investorsByType = undefined;
        }
    }

    /*Get the current Bond Offering record in case of edit to pre populate fileds. */
    @wire(getRecord, { recordId: '$getIdFromParentOnEdit', fields: [BOND_OFFERING_NAME_FIELD] })
    bondOfferingCurrentRecord;

    /*Getter to get the name of Bond Offering on Edit in Header.*/
    get name() {
        console.log("bondOfferingCurrentRecord =====" + this.bondOfferingCurrentRecord);
        this.bondOfferingName = getFieldValue(this.bondOfferingCurrentRecord.data, BOND_OFFERING_NAME_FIELD);
        return getFieldValue(this.bondOfferingCurrentRecord.data, BOND_OFFERING_NAME_FIELD);
    }

    /*This method is written to divide the Investor records in chunks for pagination.*/
    @api
    displayRecordPerPage(page) {

        console.log('investorsByType =>  ' + JSON.stringify(this.investorsByType));
        console.log('Map vlaues =>  ' + JSON.stringify(this.checkedRecordArray));

        for (let i = 0; i < this.investorsByType.length; i++) {
            console.log('Inside If ----------' + JSON.stringify(this.investorsByType[i].checked));
            this.investorsByType = this.investorsByType.map(obj =>
                this.checkedRecordArray.find(id => id.Id === obj.Id) || obj);
            console.log('Inside If ----------' + JSON.stringify(this.investorsByType[i].checked));

        }

        console.log('InvestorType=> ' + JSON.stringify(this.investorsByType));
        console.log("Current Page Number => " + page);
        this.startingRecord = ((page - 1) * this.pagesize);
        this.endingRecord = (this.pagesize * page);
        console.log("End Record => " + this.endingRecord);
        console.log("selectedInvestorType  => " + this.selectedInvestorType);
        if (this.selectedInvestorType !== 'any') {
            this.totalpages = Math.ceil(this.investorsByType
                .filter(i => i.investorType === this.selectedInvestorType).length / this.pagesize);
            this.totalrecords = this.investorsByType
                .filter(i => i.investorType === this.selectedInvestorType).length;
            this.endingRecord = (this.endingRecord > this.totalrecords) ?
                this.totalrecords : this.endingRecord;
            const event = new CustomEvent("recordsload", {
                detail: this.totalrecords
            });
            this.dispatchEvent(event);
            this.investorPerPage = this.investorsByType.filter(i => i.investorType === this.selectedInvestorType)
                .slice(this.startingRecord, this.endingRecord);
        } else {
            console.log('InvestorsOnAny => ' + JSON.stringify(this.investorsByType));
            this.totalrecords = this.investorsByType.length;
            this.totalpages = Math.ceil(this.investorsByType.length / this.pagesize);
            console.log('totalpages => ' + this.totalpages);
            console.log('totalrecords => ' + this.totalrecords);
            this.endingRecord = (this.endingRecord > this.totalrecords) ?
                this.totalrecords : this.endingRecord;
            const event = new CustomEvent("recordsload", {
                detail: this.totalrecords
            });
            this.dispatchEvent(event);
            this.investorPerPage = this.investorsByType.slice(this.startingRecord, this.endingRecord);
        }
        console.log('InvestorPerPage=> ' + JSON.stringify(this.investorPerPage[0]));
        this.startingRecord = this.startingRecord + 1;
    }

    @wire(getObjectInfo, { objectApiName: BOND_BUY_OBJECT })
    bondBuyObjectInfo;

    @wire(getPicklistValues, {
        recordTypeId: "$bondBuyObjectInfo.data.defaultRecordTypeId",
        fieldApiName: STATUS
    })
    bondBuyStatus;

    @wire(getObjectInfo, { objectApiName: INVESTOR_OBJECT })
    objectInfo;

    @wire(getPicklistValues, {
        recordTypeId: "$objectInfo.data.defaultRecordTypeId",
        fieldApiName: INVESTOR_TYPE_FIELD
    })
    investorTypePicklistValues;

    get options() {
        return [
            { label: 'Any', value: 'any' },
            { label: 'University', value: 'University' },
            { label: 'Municipality', value: 'Municipality' },
            { label: 'Pension', value: 'Pension' },
            { label: 'Hedge Fund', value: 'Hedge Fund' },
            { label: 'Others', value: 'Others' },
        ];
    }

    /* To handle filter for Investor to display. */
    handleInvestorTypeComboboxChange(event) {
        console.log("Selected Type   " + event.detail.value);
        this.selectedInvestorType = event.detail.value;
        this.currentpage = 1;
        this.displayRecordPerPage(this.currentpage);
        console.log("Calling Connected Callback");
    }

    /* Invoked when clicked Save button to save the Bond Offering and checked Bond Buy against Investors. */
    handleBondOfferingCreated(event) {
        console.log("Save Button Clicked.");
        if (!this.editBondBuy) {
            const event1 = new ShowToastEvent({
                message: "Bond Offering Created",
                variant: 'success'
            });
            this.dispatchEvent(event1);
        } else {
            const event1 = new ShowToastEvent({
                message: "Bond Offering Updated",
                variant: 'success'
            });
            this.dispatchEvent(event1);
        }
        console.log('Selected Row Length ==> ' + this.selectedRowIdsArray.length);
        console.log('Selected Row  ==> ' + JSON.stringify(this.selectedRowIdsArray));

        for (let i = 0; i < this.selectedRowIdsArray.length; i++) {
            this.bondBuyRecord = {};
            console.log("Investor IDs  " + this.selectedRowIdsArray[i]);
            this.bondBuyRecord.Id = this.idMap.get(this.selectedRowIdsArray[i]);
            this.bondBuyRecord.Units__c = this.unitsMap.get(this.selectedRowIdsArray[i]);
            this.bondBuyRecord.Status__c = this.statusMap.get(this.selectedRowIdsArray[i]);
            this.bondBuyRecord.Investor__c = this.selectedRowIdsArray[i];
            this.bondBuyRecord.Bond_Offering__c = event.detail.id;
            this.bondBuysList.push(this.bondBuyRecord);
        }
        console.log('BondBuys List JSON => ' + JSON.stringify(this.bondBuysList));
        createBondBuys({ bondBuys: JSON.stringify(this.bondBuysList), edit: '$editBondBuy' })
            .then(results => {
                this.bondBuysList = {};
                console.log('Results => ' + results);
                this.dispatchEvent(new ShowToastEvent({
                    title: 'Success!!',
                    message: 'Bond Buys Created Successfully!!',
                    variant: 'success'
                }), );
            })
        console.log("Navogating to Record View Page");
        this[NavigationMixin.Navigate]({
            type: 'standard__recordPage',
            attributes: {
                recordId: event.detail.id,
                objectApiName: 'Bond_Offering__c', // objectApiName is optional
                actionName: 'view'
            }
        });
    }

    /* Clear Bond Offering fileds data on clicking Cancel button. */
    handleReset() {
        const inputFields = this.template.querySelectorAll("lightning-input-field");
        if (inputFields) {
            inputFields.forEach(field => {
                field.reset();
            });
        }
    }

    /* Get the seleceted rows from table of Investors to create Bond Buys. */
    handleSelectedRows(event) {
        console.log(JSON.stringify(event));
        this.currentPageAfterRowSelect = event.detail.page;
        this.rowInvestorId = event.detail.detail;
        this.investorIdFromChildRow = event.detail.detail;
        this.isUncheck = event.detail.isUncheck;
        this.bondBuyUnits = event.detail.units;
        this.bondBuyStatusSelected = event.detail.status;
        this.bondBuyId = event.detail.bondBuyRecordId;
        this.investorName = event.detail.investorName;
        this.investorType = event.detail.investorType;

        this.checkedRecord = {
            "checked": !this.isUncheck,
            "Id": this.investorIdFromChildRow,
            "investorName": this.investorName,
            "investorType": this.investorType,
            "status": this.bondBuyStatusSelected,
            "units": this.bondBuyUnits
        };

        console.log("investorIdFromChildRow ==> " + this.investorIdFromChildRow);
        console.log("Uncheck ==> " + this.isUncheck);
        if (this.isUncheck && this.selectedRowIdsArray.length > 0) {
            this.unitsMap.delete(this.investorIdFromChildRow);
            this.statusMap.delete(this.investorIdFromChildRow);
            this.idMap.delete(this.investorIdFromChildRow);
            this.checkBoxMap.delete(this.investorIdFromChildRow);
            this.checkedRecordMap.delete(this.investorIdFromChildRow);

            //to delete row
            for (let i = 0; i < this.selectedRowIdsArray.length; i++) {
                if (this.selectedRowIdsArray[i] === this.investorIdFromChildRow) {
                    this.selectedRowIdsArray.splice(i, 1);
                    this.selectedRowCheckBoxArray.splice(i, 1);
                    this.selectedRowUnitsArray.splice(i, 1);
                    this.selectedRowStatusArray.splice(i, 1);
                    this.checkedRecordArray.splice(i, 1);

                }
            }
            //this.selectedRowIdsArray.remove(this.investorIdFromChildRow);
        } else {
            this.unitsMap.set(this.investorIdFromChildRow, this.bondBuyUnits);
            this.statusMap.set(this.investorIdFromChildRow, this.bondBuyStatusSelected);
            this.idMap.set(this.investorIdFromChildRow, this.bondBuyId);
            this.checkBoxMap.set(this.investorIdFromChildRow, !this.isUncheck);
            this.checkedRecordMap.set(this.investorIdFromChildRow, this.checkedRecord);
            this.selectedRowIdsArray.push(this.investorIdFromChildRow);
            this.selectedRowCheckBoxArray.push(!this.isUncheck);
            this.selectedRowUnitsArray.push(this.bondBuyUnits);
            this.selectedRowStatusArray.push(this.bondBuyStatusSelected);
            this.checkedRecordArray.push(this.checkedRecord);

            console.log("Checked Record => " + JSON.stringify(this.checkedRecord));


        }
        this.checked = !this.isUncheck;
        console.log('selectedRowIdsArray  ==> ' + this.selectedRowIdsArray + '   length ==>  ' + this.selectedRowIdsArray.length);
        //console.log('selectedRowCheckBoxArray  ==> ' + this.selectedRowCheckBoxArray + '   length ==>  ' + this.selectedRowCheckBoxArray.length);
        //console.log('selectedRowUnitsArray  ==> ' + this.selectedRowUnitsArray + '   length ==>  ' + this.selectedRowUnitsArray.length);
        //console.log('selectedRowStatusArray  ==> ' + this.selectedRowStatusArray + '   length ==>  ' + this.selectedRowStatusArray.length);
        console.log('checkedRecordArray  ==> ' + JSON.stringify(this.checkedRecordArray) + '   length ==>  ' + this.checkedRecordArray.length);

    }
}