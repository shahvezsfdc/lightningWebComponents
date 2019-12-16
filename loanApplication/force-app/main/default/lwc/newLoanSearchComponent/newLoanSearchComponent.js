import { LightningElement, track, wire, api } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { getPicklistValues } from 'lightning/uiObjectInfoApi';
import { getObjectInfo } from 'lightning/uiObjectInfoApi';
import LOAN_APPLICATION_OBJECT from '@salesforce/schema/Opportunity';
import COMMUNICATION_MASTER_OBJECT from '@salesforce/schema/Communication_Master__c';
import PRODUCT_FIELD from '@salesforce/schema/Opportunity.Product_Name__c';
import SMS_TYPE_FIELD from '@salesforce/schema/Communication_Master__c.SMS_Type__c';
import filterLoanRecordsByProductAndLMSDate from '@salesforce/apex/LWCCommunicationMonitoring.filterLoanRecordsByProductAndLMSDate';


export default class LWCLoanCommunicationSearch extends LightningElement {

    @api isLoaded = false;

    @api toggleSpinner = false;

    @track index = 1;

    @track _selected = [];

    @track Opportunities;

    @track loanAppNo;

    @track startDate;

    @track endDate;

    @track disbursedLoan;

    @track failedLoans;

    @track smsTypeValues = '';

    isDisabled = true;

    get options() {
        return [
            { label: 'None', value: '' },
            { label: 'Internal', value: 'Internal' },
            { label: 'External', value: 'External' },
        ];
    }

    @wire(getObjectInfo, { objectApiName: LOAN_APPLICATION_OBJECT })
    objectInfo;

    @wire(getPicklistValues, { recordTypeId: '$objectInfo.data.defaultRecordTypeId', fieldApiName: PRODUCT_FIELD })
    ProductValues;

    @wire(getObjectInfo, { objectApiName: COMMUNICATION_MASTER_OBJECT })
    communicationMasterObjectInfo;

    @wire(getPicklistValues, { recordTypeId: '$communicationMasterObjectInfo.data.defaultRecordTypeId', fieldApiName: SMS_TYPE_FIELD })
    SmsType;

    get selected() {
        return this._selected.length ? this._selected : 'none';
    }

    handleProductChange(event) {
        this._selected = event.detail.value;
    }

    handleLANChange(event) {
        this.loanAppNo = event.target.value;
    }

    handleStartDate(event) {
        this.startDate = event.target.value;
    }

    handleEndDate(event) {
        this.endDate = event.target.value;
    }

    handleSMSTypeChange(event) {
        this.smsTypeValues = event.detail.value;
    }

    getLoanDetails() {
        this.toggleSpinner = true;
        this.indexvar += 1;
        if ((this._selected !== undefined && this.startDate !== undefined && this.endDate !== undefined) || this.loanAppNo !== undefined) {
            filterLoanRecordsByProductAndLMSDate({
                stageName: 'Central Ops', fromDate: this.startDate, toDate: this.endDate,
                smsType: this.smsTypeValues, loanApplicationNumbers: this.loanAppNo, productNames: this._selected, statusValue: 'failed'
            }).then(result => {

                if (result.errors !== null && result.errors !== undefined && result.errors !== "") {
                    const event = new ShowToastEvent({
                        message: JSON.stringify(result.errors[0]),
                    });
                    this.dispatchEvent(event);
                    this.toggleSpinner = false;
                }
                else if (result.messages !== null && result.messages !== undefined && result.messages !== "") {
                    const event = new ShowToastEvent({
                        message: JSON.stringify(result.messages),
                    });
                    this.dispatchEvent(event);

                    this.toggleSpinner = false;
                }
                this.Opportunities = result;
                this.toggleSpinner = false;
                this.isDisabled = false;
            })
        }
        else {
            this.toggleSpinner = false;
            const event = new ShowToastEvent({
                message: 'Enter the required fields.',
            });
            this.dispatchEvent(event);
        }

    }

    getDetailedReport() {

        this.toggleSpinner = true;
        window.location = "/apex/CommunicationMonitoringVF?product=" + this._selected
            + "&startDate=" + this.startDate + "&endDate=" + this.endDate + "&smsType=" + this.smsTypeValues
            + "&LAN=" + this.loanAppNo + "&stage=Central Ops&statusValue= ";
        this.toggleSpinner = false;
    }

    getFailedCommunicationReport(event) {

        this.toggleSpinner = true;
        event.currentTarget.href = "/apex/CommunicationMonitoringVF?product=" + event.currentTarget.dataset.product
            + "&startDate=" + this.startDate + "&endDate=" + this.endDate + "&smsType=" + this.smsTypeValues
            + "&LAN=" + this.loanAppNo + "&stage=Central Ops&statusValue=Failed";
        this.toggleSpinner = false;
    }

}
