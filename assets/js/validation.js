class ValidationErrorFilter {
    constructor(prefix = "") {
        this.prefix = prefix;
        this.validationErrors = new Map(); // Menyimpan kesalahan menggunakan Map
    }

    filterValidationErrors(responseData) {
        const validationErrors = new Set();

        Object.entries(responseData.errors).forEach(([key, errorMessages]) => {
            const inputElement = this._findInputElement(key);

            if (!inputElement) {
                console.error(`Input element not found for ${this.prefix + key}.`);
                return;
            }

            if (inputElement.type === "radio" || inputElement.type === "checkbox") {
                this._addErrorToGroup(inputElement, errorMessages);
            } else {
                this._addErrorToInput(inputElement, errorMessages);
            }

            errorMessages.forEach(error => validationErrors.add(error));
        });

        return Array.from(validationErrors);
    }

    _findInputElement(key) {
        return document.getElementById(this.prefix + key) ||
            document.querySelector(`[name="${this.prefix + key}"]`);
    }

    _createErrorList(errorMessages) {
        const errorListElement = document.createElement("ul");
        errorListElement.classList.add("error-list", "list-unstyled", "text-danger");

        errorMessages.forEach(errorMessage => {
            const listItem = document.createElement("li");
            listItem.textContent = errorMessage;
            errorListElement.appendChild(listItem);
        });

        return errorListElement;
    }

    _addErrorToInput(inputElement, errorMessages) {
        const errorListElement = this._createErrorList(errorMessages);
        this._replaceErrorList(inputElement, errorListElement);
        this._highlightInput(inputElement);
        this._attachInputListener(inputElement);
        this.validationErrors.set(inputElement, errorMessages);
    }

    _addErrorToGroup(inputElement, errorMessages) {
        const groupName = inputElement.name;
        const groupElements = document.querySelectorAll(`[name="${groupName}"]`);

        if (groupElements.length > 0) {
            const parentElement = groupElements[0].closest('fieldset, div') || groupElements[0].parentNode;
            const errorListElement = this._createErrorList(errorMessages);

            this._replaceErrorList(parentElement, errorListElement);
            this._highlightGroup(groupElements);
            this._attachGroupListener(groupElements, groupName);

            this.validationErrors.set(parentElement, errorMessages);
        }
    }

    _replaceErrorList(element, errorListElement) {
        const previousErrorList = element.querySelector(".error-list") || element.nextElementSibling;
        if (previousErrorList && previousErrorList.classList.contains("error-list")) {
            previousErrorList.remove();
        }
        element.parentNode.insertBefore(errorListElement, element.nextSibling);
    }

    _highlightInput(inputElement) {
        inputElement.classList.add("is-invalid");
    }

    _highlightGroup(groupElements) {
        groupElements.forEach(el => el.classList.add("is-invalid"));
    }

    _attachInputListener(inputElement) {
        inputElement.addEventListener('input', () => this._clearErrorFromInput(inputElement));
    }

    _attachGroupListener(groupElements, groupName) {
        groupElements.forEach(el => {
            el.addEventListener('change', () => this._clearErrorFromGroup(groupName));
        });
    }

    _clearErrorFromInput(inputElement) {
        inputElement.classList.remove("is-invalid");
        const errorList = inputElement.nextElementSibling;
        if (errorList && errorList.classList.contains("error-list")) {
            errorList.remove();
        }
        this.validationErrors.delete(inputElement);
    }

    _clearErrorFromGroup(groupName) {
        const groupElements = document.querySelectorAll(`[name="${groupName}"]`);
        const parentElement = groupElements[0].closest('fieldset, div') || groupElements[0].parentNode;

        groupElements.forEach(el => el.classList.remove("is-invalid"));

        const errorList = parentElement.querySelector(".error-list");
        if (errorList) {
            errorList.remove();
        }
        this.validationErrors.delete(parentElement);
    }

    clearAllErrors() {
        this.validationErrors.forEach((_, element) => {
            this._clearErrorFromInput(element);
        });
    }

    logErrors() {
        console.group("validasi bermasalahs");
        this.validationErrors.forEach((errorMessages, element) => {
            console.error(`Errors for ${element.name || element.id}:`, errorMessages);
        });
        console.groupEnd();
    }
}
