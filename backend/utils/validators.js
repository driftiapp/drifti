const validateDateRange = (range) => {
    const validRanges = ['today', 'week', 'month', 'year'];
    return validRanges.includes(range);
};

const validateExportFormat = (format) => {
    const validFormats = ['csv', 'json'];
    return validFormats.includes(format);
};

const validateBusinessId = (businessId) => {
    return /^[0-9a-fA-F]{24}$/.test(businessId);
};

module.exports = {
    validateDateRange,
    validateExportFormat,
    validateBusinessId
}; 