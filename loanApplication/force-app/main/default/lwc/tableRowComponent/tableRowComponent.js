/* eslint-disable no-console */
import { LightningElement, api, track, wire } from 'lwc';
import { getPicklistValues } from "lightning/uiObjectInfoApi";
import { getObjectInfo } from "lightning/uiObjectInfoApi";
import BOND_BUY_OBJECT from "@salesforce/schema/Bond_Buy__c";
import STATUS from "@salesforce/schema/Bond_Buy__c.Status__c";

export default class tableRowComponent extends LightningElement {

    @api rowInvestorId;
    @track bondBuyUnits;
    @track bondBuyStatusSelected;
    @track statusDisabled;
    @track checkBoxDisabled = true;
    @api selectedRow;
    @api investors;
    @api editBondBuy;
    @api isUncheck = false;
    @api investorBuys;
    @api currentPage;
    @track investorBuy;
    @track isDisabled = true;
    @track updatedInvestors;
    @api bondBuyId;
    selectedRowIdsArray = [];

    @api units;
    @api status;
    @api isChecked = false;


    @wire(getObjectInfo, { objectApiName: BOND_BUY_OBJECT })
    bondBuyObjectInfo;

    @wire(getPicklistValues, {
        recordTypeId: "$bondBuyObjectInfo.data.defaultRecordTypeId",
        fieldApiName: STATUS
    })
    bondBuyStatus;

    handleRowSelect(event) {
        if (this.bondBuyStatusSelected !== undefined && this.bondBuyUnits !== undefined) {
            this.checkBoxDisabled = false;
        }
        if (event.target.checked) {
            this.rowInvestorId = event.currentTarget.dataset.key;
            this.isUncheck = false;
            this.selectedRow = event.target.checked;
            this.isChecked = true;
        } else {
            this.isUncheck = true;
            this.rowInvestorId = event.currentTarget.dataset.key;
        }
        console.log('ChildInvestorId=> ' + this.rowInvestorId);
        const selectedRowEvent = new CustomEvent("selectedrow", {
            detail: {
                bondBuyRecordId: this.bondBuyId,
                page: this.currentPage,
                detail: this.rowInvestorId,
                isUncheck: this.isUncheck,
                units: this.bondBuyUnits,
                status: this.bondBuyStatusSelected,
                investorName: this.investors.investorName,
                investorType: this.investors.investorType
            }
        });
        this.dispatchEvent(selectedRowEvent);

    }

    handleUnitsChange(event) {

        if (this.editBondBuy) {
            this.bondBuyUnits = event.target.value;
        } else {
            this.bondBuyUnits = event.target.value;
            if (this.bondBuyStatusSelected !== undefined)
                this.isDisabled = false;
        }
    }

    handlebondBuyStatusChange(event) {

        if (this.editBondBuy) {
            this.bondBuyStatusSelected = event.target.value;
            this.isDisabled = false;
        } else {
            this.bondBuyStatusSelected = event.target.value;
            if (this.bondBuyUnits !== undefined)
                this.isDisabled = false;
        }
    }
}