const Banking = require('../models/Banking');
const { restrictOperation } = require('../middleware/auth');

exports.createBankingTransaction = [
    restrictOperation('banking_transaction'),
    async (req, res) => {
        const {
            type,
            amount,
            employeeId,
            description,
            charge,
            paymentMethod,
        } = req.body;

        try {
            // Input validation
            if (!['deposit', 'withdrawal', 'borrowing', 'ledger_transfer'].includes(type)) {
                return res.status(400).json({ message: 'Invalid transaction type' });
            }
            if (amount <= 0) {
                return res.status(400).json({ message: 'Amount must be positive' });
            }
            if (type === 'borrowing' && !employeeId) {
                return res.status(400).json({ message: 'Employee ID required for borrowing' });
            }
            if (type === 'withdrawal' && !['paynearby', 'online'].includes(paymentMethod)) {
                return res.status(400).json({ message: 'Payment method must be paynearby or online for withdrawal' });
            }
            if (type !== 'withdrawal' && paymentMethod) {
                return res.status(400).json({ message: 'Payment method only applies to withdrawals' });
            }
            if (charge !== undefined && charge < 0) {
                return res.status(400).json({ message: 'Charge cannot be negative' });
            }
            if (type === 'ledger_transfer' && amount < 5) {
                return res.status(400).json({ message: 'Amount must be at least 5 to cover transfer charge' });
            }

            // Calculate charge
            let transactionCharge = charge !== undefined ? charge : (amount / 1000) * 10;
            if (type === 'borrowing') {
                transactionCharge = 0;
            } else if (type === 'ledger_transfer') {
                transactionCharge = -5; // Fixed -5 INR charge for ledger transfer
            }

            // Get latest balances
            const latestTransaction = await Banking.findOne().sort({ createdAt: -1 });
            const currentBalances = latestTransaction || {
                cashBalance: 0,
                ledgerBalance: 0,
                onlineWalletBalance: 0,
            };

            let newCashBalance = currentBalances.cashBalance;
            let newLedgerBalance = currentBalances.ledgerBalance;
            let newOnlineWalletBalance = currentBalances.onlineWalletBalance;

            // Apply transaction logic with balance validation
            if (type === 'deposit') {
                if (newOnlineWalletBalance < amount) {
                    return res.status(400).json({ message: 'Insufficient online wallet balance for deposit' });
                }
                newCashBalance += (amount + transactionCharge);
                newOnlineWalletBalance -= amount;
            } else if (type === 'withdrawal') {
                const projectedCashBalance = newCashBalance - amount + transactionCharge;
                if (projectedCashBalance < 0) {
                    return res.status(400).json({ message: 'Insufficient cash balance for withdrawal' });
                }
                newCashBalance = projectedCashBalance;
                if (paymentMethod === 'paynearby') {
                    newLedgerBalance += amount;
                } else if (paymentMethod === 'online') {
                    newOnlineWalletBalance += amount;
                }
            } else if (type === 'borrowing') {
                if (newCashBalance < amount) {
                    return res.status(400).json({ message: 'Insufficient cash balance for borrowing' });
                }
                newCashBalance -= amount;
            } else if (type === 'ledger_transfer') {
                if (newLedgerBalance < amount) {
                    return res.status(400).json({ message: 'Insufficient ledger balance for transfer' });
                }
                newLedgerBalance -= amount;
                newOnlineWalletBalance += (amount + transactionCharge); // Add amount minus 5 INR charge
            }

            // Calculate mainBalance
            const newMainBalance = newCashBalance + newLedgerBalance + newOnlineWalletBalance;

            // Calculate profit
            const profit = transactionCharge;

            // Logging
            console.log('Transaction Summary:', {
                type,
                amount,
                charge: transactionCharge,
                cashBalance: newCashBalance,
                ledgerBalance: newLedgerBalance,
                onlineWalletBalance: newOnlineWalletBalance,
                mainBalance: newMainBalance,
                profit,
            });

            // Save transaction
            const banking = new Banking({
                type,
                amount,
                charge: transactionCharge,
                profit,
                paymentMethod: type === 'withdrawal' ? paymentMethod : null,
                employeeId: type === 'borrowing' ? employeeId : null,
                description,
                cashBalance: newCashBalance,
                ledgerBalance: newLedgerBalance,
                onlineWalletBalance: newOnlineWalletBalance,
                mainBalance: newMainBalance,
            });

            await banking.save();
            res.status(201).json(banking);
        } catch (err) {
            console.error('Error in createBankingTransaction:', err.stack);
            res.status(500).json({ message: 'Server error', error: err.message });
        }
    },
];

exports.getBankingTransactions = [
    restrictOperation('banking_view'),
    async (req, res) => {
        try {
            const { startDate, endDate } = req.query;
            let query = {};

            if (startDate && endDate) {
                query.createdAt = {
                    $gte: new Date(startDate),
                    $lte: new Date(endDate),
                };
            }

            const transactions = await Banking.find(query)
                .populate('employeeId')
                .sort({ createdAt: -1 });

            res.json(transactions);
        } catch (err) {
            console.error('Error in getBankingTransactions:', err.stack);
            res.status(500).json({ message: 'Server error', error: err.message });
        }
    },
];