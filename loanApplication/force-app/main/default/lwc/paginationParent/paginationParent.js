import { LightningElement, api } from "lwc";
const PAGE_SIZE = 5;
export default class PaginationParent extends LightningElement {
    @api recordId;
    @api editEnabled;
    @api page = 1;
    @api totalrecords;
    @api _pagesize = PAGE_SIZE;
    get pagesize() {
        return this._pagesize;
    }
    set pagesize(value) {
        this._pagesize = value;
    }
    handlePrevious() {
        if (this.page > 1) {
            this.page = this.page - 1;
        }
        this.template.querySelector('c-record-list').displayRecordPerPage(this.page);
    }
    handleNext() {
        if (this.page < this.totalPages) this.page = this.page + 1;
        this.template.querySelector('c-record-list').displayRecordPerPage(this.page);
    }
    handleFirst() {
        this.page = 1;
        this.template.querySelector('c-record-list').displayRecordPerPage(this.page);
    }
    handleLast() {
        this.page = this.totalPages;
        this.template.querySelector('c-record-list').displayRecordPerPage(this.page);
    }
    handleRecordsLoad(event) {
        this.totalrecords = event.detail;
        this.totalPages = Math.ceil(this.totalrecords / this.pagesize);
    }
    handlePageChange(event) {
        this.page = event.detail;
    }
}