// utils/validation.js
exports.validatePhoneNumbers = (numbers, campaignType) => {
  const validNumbers = [];
  const invalidNumbers = [];
  
  numbers.forEach(number => {
    // Clean the number - remove non-digit characters except leading +
    let cleanNumber = number.replace(/[^\d+]/g, '');
    
    // Basic validation
    if (!cleanNumber) {
      invalidNumbers.push({ number, reason: 'Empty or invalid format' });
      return;
    }
    
    // WhatsApp specific validation (should start with country code)
    if (campaignType === 'whatsapp') {
      // Remove leading zeros and add Indonesian country code if missing
      if (cleanNumber.startsWith('0')) {
        cleanNumber = '62' + cleanNumber.substring(1);
      }
      
      // WhatsApp numbers should start with country code
      if (!cleanNumber.startsWith('+') && !cleanNumber.startsWith('62')) {
        invalidNumbers.push({ number, reason: 'WhatsApp numbers must start with country code (62)' });
        return;
      }
      
      // Remove + if present for consistency
      if (cleanNumber.startsWith('+')) {
        cleanNumber = cleanNumber.substring(1);
      }
    }
    
    // SMS validation (can be local format)
    if (campaignType === 'sms') {
      // For SMS, we can accept local numbers starting with 0
      if (cleanNumber.startsWith('0')) {
        cleanNumber = '62' + cleanNumber.substring(1);
      }
    }
    
    // Final length validation
    if (cleanNumber.length < 10 || cleanNumber.length > 15) {
      invalidNumbers.push({ number, reason: 'Invalid phone number length' });
      return;
    }
    
    validNumbers.push(cleanNumber);
  });
  
  return { validNumbers, invalidNumbers };
};