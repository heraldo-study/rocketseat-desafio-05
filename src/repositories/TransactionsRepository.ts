import { EntityRepository, Repository } from 'typeorm';

import Transaction from '../models/Transaction';

interface Balance {
  income: number;
  outcome: number;
  total: number;
}

@EntityRepository(Transaction)
class TransactionsRepository extends Repository<Transaction> {
  public async getBalance(): Promise<Balance> {
    const transaction = await this.find();

    const balance = transaction.reduce(
      (acc, transaction) => {
        switch (transaction.type) {
          case 'income':
            acc.income += Number(transaction.value);
            acc.total += Number(transaction.value);
            break;

          case 'outcome':
            acc.outcome += Number(transaction.value);
            acc.total -= Number(transaction.value);
            break;

          default:
            break;
        }

        return acc;
      },
      {
        income: 0,
        outcome: 0,
        total: 0,
      },
    );
    return balance;
  }
}

export default TransactionsRepository;
