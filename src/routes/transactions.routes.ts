import multer from 'multer';
import { getCustomRepository, getRepository } from 'typeorm';
import { Router, Request, Response } from 'express';

import TransactionsRepository from '../repositories/TransactionsRepository';
import CreateTransactionService from '../services/CreateTransactionService';
// import DeleteTransactionService from '../services/DeleteTransactionService';
import ImportTransactionsService from '../services/ImportTransactionsService';
import { TransactionDTO } from '../dtos/TransactionDTO';
import Category from '../models/Category';
import uploadConfig from '../config/upload';

const upload = multer(uploadConfig);

const transactionsRouter = Router();

transactionsRouter.get('/', async (request: Request, response: Response) => {
  const transactionsRepository = getCustomRepository(TransactionsRepository);
  const transactions = await transactionsRepository.find();
  const balance = await transactionsRepository.getBalance();

  return response.send({ transactions, balance });
});

transactionsRouter.post('/', async (request: Request, response: Response) => {
  const transactionsRepository = getCustomRepository(TransactionsRepository);
  const categoryRepository = getRepository(Category);
  const createTransactionService = new CreateTransactionService(
    transactionsRepository,
    categoryRepository,
  );
  const { title, value, type, category }: TransactionDTO = request.body;

  const transaction = await createTransactionService.execute({
    title,
    value,
    type,
    category,
  });

  response.status(201).json(transaction);
});

transactionsRouter.delete(
  '/:id',
  async (request: Request, response: Response) => {
    const transactionsRepository = getCustomRepository(TransactionsRepository);
    const deleted = await transactionsRepository.delete({
      id: request.params.id,
    });

    if (deleted.affected) {
      return response.status(204).send();
    }

    return response.status(400).send();
  },
);

transactionsRouter.post(
  '/import',
  upload.single('file'),
  async (request: Request, response: Response) => {
    const transactionsRepository = getCustomRepository(TransactionsRepository);
    const categoryRepository = getRepository(Category);
    const importService = new ImportTransactionsService(
      transactionsRepository,
      categoryRepository,
    );

    const transactions = await importService.execute(request.file.path);

    return response.status(201).json(transactions);
  },
);

export default transactionsRouter;
