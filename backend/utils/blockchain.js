// utils/blockchain.js (versi sederhana)

// Validasi dasar alamat blockchain (tanpa library eksternal)
exports.validateAddress = (network, address) => {
  switch (network) {
    case 'TRC20':
      // Format dasar alamat TRON (T diawal + 33 karakter)
      return /^T[a-zA-Z0-9]{33}$/.test(address);
    
    case 'ERC20':
    case 'BEP20':
      // Format dasar alamat Ethereum (0x + 40 karakter hex)
      return /^0x[a-fA-F0-9]{40}$/.test(address);
    
    default:
      return false;
  }
};

// Simulasi generate address (untuk development)
exports.generateDepositAddress = (network) => {
  const prefixes = {
    TRC20: 'T',
    ERC20: '0x',
    BEP20: '0x'
  };
  
  const randomChars = Array.from({ length: 33 }, () => 
    Math.random().toString(36).substring(2, 3)
  ).join('');

  return `${prefixes[network]}${randomChars}`;
};