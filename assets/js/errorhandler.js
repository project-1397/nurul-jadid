const ErrorHandler = (() => {
    const config = {
        maxLogBatchSize: 50,
        errorEndpoint: "/log-error",
    };

    const errorQueue = [];
    const defaultHeaders = {};

    const formatDate = (date = new Date()) =>
        date.toISOString().replace("T", " ").split(".")[0];

    const getBaseUrl = (() => {
        const {origin, pathname} = window.location;
        const pathSegments = pathname.split("/").filter(Boolean);

        if (window.location.hostname === "localhost") {
            return pathSegments[0] ? `${origin}/${pathSegments[0]}` : origin;
        }

        return origin;
    })();

    const getToken = (name) =>
        document.querySelector(`meta[name="${name}"]`)?.getAttribute("content");

    const setupHeaders = () => {
        defaultHeaders["Content-Type"] = "application/json";
        defaultHeaders["Content-Type"] = "application/json";
        defaultHeaders["X-CSRF-TOKEN"] = getToken("X-CSRF-TOKEN");
    };

    const extractStackLocation = (stack) => {
        const match = stack.split("\n")[1]?.match(/at\s(.+):(\d+):(\d+)/);
        return match ? {file: match[1], line: match[2], column: match[3]} : {
            file: "Unknown",
            line: "N/A",
            column: "N/A"
        };
    };

    const processError = (error) => ({
        message: error?.message || "Unknown error",
        stack: error?.stack || "No stack trace available",
        type: error?.response ? `HTTP Error ${error.response.status}` : "Client Error",
        location: extractStackLocation(error?.stack || ""),
        userAgent: navigator.userAgent,
        url: window.location.href,
        timestamp: formatDate(),
        ...(error?.response && {response: error.response}),
        ...(error?.request && {request: error.request}),
    });

    const enqueueError = (errorDetails) => {
        errorQueue.push(errorDetails);
        if (errorQueue.length >= config.maxLogBatchSize) {
            processErrorQueue();
        }
    };

    const processErrorQueue = async () => {
        if (!errorQueue.length) {
            return;
        }

        const errorsToLog = errorQueue.splice(0, config.maxLogBatchSize);
        await sendErrorsToServer(errorsToLog);
    };

    const sendErrorsToServer = async (errors) => {
        try {
            const response = await fetch(`${getBaseUrl}${config.errorEndpoint}`, {
                method: "POST",
                headers: defaultHeaders,
                body: JSON.stringify({errors}),
            });

            if (!response.ok) {
                console.error("Failed to log errors:", response.statusText);
            }
        } catch (err) {
            console.error("Internal server error", err);
        }
    };

    const displayErrorToUser = () => {
        Swal.fire({
            icon: "error",
            title: "Error",
            text: "Internal server error",
            confirmButtonText: "Close",
        });
    };

    const handleError = async (error) => {
        try {
            const errorDetails = processError(error);
            displayErrorToUser(errorDetails.message);
            enqueueError(errorDetails);
            localStorage.clear();
            sessionStorage.clear();
            await processErrorQueue();
        } catch (err) {
            console.error("Internal server error", err);
        }
    };

    setupHeaders();

    return {handleError};
})();
