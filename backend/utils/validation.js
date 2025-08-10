exports.validatePhoneNumbers = (numbers, campaignType) => {
  const validNumbers = [];
  const invalidNumbers = [];
  
  numbers.forEach(num => {
    const cleaned = num.replace(/\D/g, '');
    let isValid = false;

    // Validasi berbeda untuk WhatsApp/SMS
    if (campaignType === 'whatsapp') {
      // Validasi nomor WhatsApp
      isValid = /^(\+62|62|0)8[1-9][0-9]{6,9}$/.test(cleaned);
    } else {
      // Validasi lebih umum untuk SMS
      isValid = cleaned.length >= 8 && cleaned.length <= 15;
    }

    if (isValid) {
      validNumbers.push(cleaned);
    } else {
      invalidNumbers.push(num);
    }
  });
  
  return { validNumbers, invalidNumbers };
};