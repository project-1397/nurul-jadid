class DateFormatter {
    constructor() {
        this.dateFormats = [
            {
                regex: /^\d{4}-\d{2}-\d{2}( \d{2}:\d{2}:\d{2})?$/,
                parseOrder: ["year", "month", "day"],
            }, // Y-m-d atau Y-m-d H:i:s
            {
                regex: /^\d{2}\/\d{2}\/\d{4}( \d{2}:\d{2}:\d{2})?$/,
                separator: "/",
                parseOrder: ["day", "month", "year"],
            }, // d/m/Y atau d/m/Y H:i:s
            {
                regex: /^\d{2}-\d{2}-\d{4}( \d{2}:\d{2}:\d{2})?$/,
                separator: "-",
                parseOrder: ["day", "month", "year"],
            }, // d-m-Y atau d-m-Y H:i:s
        ];
    }

    formatDate(dateString) {
        if (!dateString || typeof dateString != "string") {
            return "";
        }

        for (const format of this.dateFormats) {
            const {regex, separator = "-", parseOrder} = format;
            if (regex.test(dateString)) {
                const parsedDate = this.parseDate(
                    dateString,
                    separator,
                    parseOrder
                );
                return this.isValidDate(parsedDate)
                    ? this.formatOutput(parsedDate)
                    : "";
            }
        }

        return "";
    }

    parseDate(dateString, separator, parseOrder) {
        const parts = dateString.split(new RegExp(`[${separator} :]+`));
        const dateComponents = {
            year: null,
            month: null,
            day: null,
            hour: 0,
            minute: 0,
            second: 0,
        };

        parseOrder.forEach((component, index) => {
            dateComponents[component] = parseInt(parts[index], 10);
        });

        if (parts.length > 3) {
            [
                dateComponents.hour,
                dateComponents.minute,
                dateComponents.second,
            ] = parts.slice(3).map((part) => parseInt(part, 10) || 0);
        }

        return dateComponents;
    }

    isValidDate({year, month, day, hour, minute, second}) {
        const isValidYear = year >= 1900 && year <= 2100;
        const isValidMonth = month >= 1 && month <= 12;
        const isValidDay = day >= 1 && day <= 31;
        const isValidTime =
            hour >= 0 &&
            hour < 24 &&
            minute >= 0 &&
            minute < 60 &&
            second >= 0 &&
            second < 60;

        return isValidYear && isValidMonth && isValidDay && isValidTime;
    }

    formatOutput({day, month, year, hour, minute, second}) {
        const datePart = `${String(day).padStart(2, "0")}/${String(
            month
        ).padStart(2, "0")}/${year}`;
        const timePart = `${String(hour).padStart(2, "0")}:${String(
            minute
        ).padStart(2, "0")}:${String(second).padStart(2, "0")}`;

        return hour || minute || second ? `${datePart} ${timePart}` : datePart;
    }
}

const formatter = new DateFormatter();
