const db = require('../config/db');

// Check if user qualifies for referral commissions
exports.checkUserReferralStatus = async (userId) => {
  try {
    // Check if user has minimum deposit
    const [deposit] = await db.query(
      `SELECT SUM(amount) as total 
       FROM deposits 
       WHERE user_id = ? AND status = 'approved'`,
      [userId]
    );
    
    const hasDeposit = deposit[0]?.total >= 10;
    
    // Check if user was referred by someone
    const [referral] = await db.query(
      `SELECT referrer_id FROM users WHERE id = ? AND referred_by IS NOT NULL`,
      [userId]
    );
    
    return {
      qualifies: hasDeposit && referral.length > 0,
      referrer_id: referral[0]?.referrer_id,
      total_deposited: deposit[0]?.total || 0
    };
  } catch (err) {
    console.error('Referral status check error:', err);
    throw err;
  }
};

// Award domino commissions through referral chain
exports.awardDominoCommissions = async (referredUserId) => {
  try {
    // Get the entire referral chain
    const [chain] = await db.query(`
      WITH RECURSIVE referral_chain AS (
        SELECT referrer_id, referred_id, 1 as level
        FROM referrals
        WHERE referred_id = ?
        
        UNION ALL
        
        SELECT r.referrer_id, r.referred_id, rc.level + 1
        FROM referrals r
        JOIN referral_chain rc ON r.referred_id = rc.referrer_id
      )
      SELECT referrer_id, level FROM referral_chain
      ORDER BY level
    `, [referredUserId]);

    const commissionsAwarded = [];
    
    // Process each level in the chain
    for (const link of chain) {
      const referrerId = link.referrer_id;
      const level = link.level;
      
      // Check if both users have minimum deposit
      const referrerStatus = await exports.checkUserReferralStatus(referrerId);
      const referredStatus = await exports.checkUserReferralStatus(referredUserId);
      
      if (referrerStatus.qualifies && referredStatus.qualifies) {
        // Calculate commission based on level (higher levels get less)
        const commissionAmount = (0.5 / level).toFixed(2);
        
        // Add commission
        await db.query(
          'INSERT INTO commissions (user_id, amount, level, status) VALUES (?, ?, ?, "pending")',
          [referrerId, commissionAmount, level]
        );
        
        commissionsAwarded.push({
          referrer_id: referrerId,
          amount: commissionAmount,
          level
        });
      }
    }
    
    return commissionsAwarded;
  } catch (err) {
    console.error('Domino commission error:', err);
    throw err;
  }
};