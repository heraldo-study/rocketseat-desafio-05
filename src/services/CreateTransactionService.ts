import { Repository } from 'typeorm';
// import AppError from '../errors/AppError';
import Transaction from '../models/Transaction';
import TransactionsRepository from '../repositories/TransactionsRepository';
import { TransactionDTO } from '../dtos/TransactionDTO';
import Category from '../models/Category';
import AppError from '../errors/AppError';

class CreateTransactionService {
  private transactionsRepository: TransactionsRepository;

  private categoryRepository: Repository<Category>;

  constructor(
    transactionsRepository: TransactionsRepository,
    categoryRepository: Repository<Category>,
  ) {
    this.transactionsRepository = transactionsRepository;
    this.categoryRepository = categoryRepository;
  }

  public async execute({
    title,
    value,
    type,
    category,
  }: TransactionDTO): Promise<Transaction> {
    const { total } = await this.transactionsRepository.getBalance();

    if (type === 'outcome' && total < value)
      throw new AppError('Insuficiente founds', 400);

    let categoryEntity = await this.categoryRepository.findOne({
      where: {
        title: category,
      },
    });

    if (!categoryEntity) {
      categoryEntity = this.categoryRepository.create({
        title: category,
      });
      await this.categoryRepository.save(categoryEntity);
    }

    const transaction = this.transactionsRepository.create({
      title,
      value,
      type,
      category: categoryEntity,
    });

    await this.transactionsRepository.save(transaction);

    return transaction;
  }
}

export default CreateTransactionService;
