import csvParse from 'csv-parse';
import fs from 'fs';
import Transaction from '../models/Transaction';
import TransactionsRepository from '../repositories/TransactionsRepository';
import { Repository, In } from 'typeorm';
import Category from '../models/Category';
import { TransactionDTO } from '../dtos/TransactionDTO';

class ImportTransactionsService {
  private transactionsRepository: TransactionsRepository;

  private categoryRepository: Repository<Category>;

  constructor(
    transactionsRepository: TransactionsRepository,
    categoryRepository: Repository<Category>,
  ) {
    this.transactionsRepository = transactionsRepository;
    this.categoryRepository = categoryRepository;
  }

  async execute(filePath: string): Promise<Transaction[]> {
    const readCSVStream = fs.createReadStream(filePath);
    const parseStream = csvParse({
      from_line: 2,
      ltrim: true,
      rtrim: true,
    });

    const parseCSV = readCSVStream.pipe(parseStream);

    const transactions: TransactionDTO[] = [];
    const categories: string[] = [];

    parseCSV.on('data', async line => {
      const [title, type, value, category] = line;

      if (!title || !type || !value) return;

      categories.push(category);
      transactions.push({
        title,
        type,
        value,
        category,
      });
    });

    await new Promise(resolve => parseCSV.on('end', resolve));

    const finalCategories = await this.filterAndCreateCategories(categories);

    const createdTransactions = this.transactionsRepository.create(
      transactions.map(transaction => ({
        title: transaction.title,
        type: transaction.type,
        value: transaction.value,
        category: finalCategories.find(
          category => category.title === transaction.category,
        ),
      })),
    );

    await this.transactionsRepository.save(createdTransactions);

    return createdTransactions;
  }

  private async filterAndCreateCategories(
    categories: string[],
  ): Promise<Category[]> {
    const existingCategory = await this.categoryRepository.find({
      where: In(categories),
    });

    const categoryTitles = existingCategory.map(
      categoryEntities => categoryEntities.title,
    );

    const categoriesToAdd = categories
      .filter(category => !categoryTitles.includes(category))
      .filter((value, index, self) => self.indexOf(value) === index);

    const newCategories = this.categoryRepository.create(
      categoriesToAdd.map(category => ({ title: category })),
    );

    await this.categoryRepository.save(newCategories);

    return [...newCategories, ...existingCategory];
  }
}

export default ImportTransactionsService;
