import * as Yup from 'yup';
import { parseISO, format } from 'date-fns';
import { Op } from 'sequelize';

import DeliveryProblem from '../models/DeliveryProblem';
import Delivery from '../models/Delivery';
import DeliveryMan from '../models/Deliverman';
import Recipient from '../models/Recipient';

import Queue from '../../lib/Queue';
import CancellationMail from '../jobs/CancellationMail';

class DeliveryProblemController {
  async index(req, res) {
    const schema = Yup.object().shape({
      page: Yup.number(),
    });

    if (!(await schema.isValid(req.query))) {
      return res.status(400).json({ error: 'Query Validation fails!' });
    }

    const { page = 1, limit = 5, q } = req.query;
    let query = {};
    if (q) {
      query = {
        description: {
          [Op.iLike]: `%${q}%`,
        },
      };
    }

    const { count, rows } = await DeliveryProblem.findAndCountAll({
      where: query,
      limit,
      offset: (page - 1) * limit,
      order: [['id', 'ASC']],
      attributes: ['id', 'description', 'createdAt', 'updatedAt'],
      include: [
        {
          model: Delivery,
          as: 'delivery',
          attributes: ['id', 'product', 'canceled_at'],
          include: [
            {
              model: Recipient,
              as: 'recipient',
              attributes: ['name'],
            },
            {
              model: DeliveryMan,
              as: 'deliveryman',
              attributes: ['name'],
            },
          ],
        },
      ],
    });

    if (!rows.length) {
      return res
        .status(400)
        .json({ message: 'No ordering problem to be shown.' });
    }

    return res.json({ count, problems: rows });
  }

  async show(req, res) {
    const schema = Yup.object().shape({
      id: Yup.number().required(),
    });

    if (!(await schema.isValid(req.params))) {
      return res.status(400).json({ error: 'Params Validation fails!' });
    }
    const { id } = req.params;

    const problems = await DeliveryProblem.findAll({
      where: {
        delivery_id: id,
      },
      order: [['id', 'ASC']],
      include: [
        {
          model: Delivery,
          as: 'delivery',
          attributes: ['id', 'product', 'canceled_at'],
        },
      ],
    });

    if (!problems.length) {
      return res
        .status(400)
        .json({ message: 'No ordering problem to be shown.' });
    }

    return res.json(problems);
  }

  async store(req, res) {
    const schema = Yup.object().shape({
      description: Yup.string().required(),
    });

    const schemaParams = Yup.object().shape({
      id: Yup.number().required(),
    });

    if (!(await schemaParams.isValid(req.params))) {
      return res.status(400).json({ error: 'Params Validation fails!' });
    }

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails!' });
    }
    const { id } = req.params;
    const { description } = req.body;

    const pickDelivery = await Delivery.findByPk(id);

    if (!pickDelivery) {
      return res.status(400).json({ message: 'Delivery does not found!' });
    }

    const problem = await DeliveryProblem.create({
      delivery_id: id,
      description,
    });
    const pickProblem = await DeliveryProblem.findByPk(problem.id, {
      include: [
        {
          model: Delivery,
          as: 'delivery',
          attributes: ['id', 'product', 'canceled_at'],
        },
      ],
    });

    return res.json(pickProblem);
  }

  async delete(req, res) {
    const schemaParams = Yup.object().shape({
      id: Yup.number().required(),
    });
    const schemaQuery = Yup.object().shape({
      canceled_at: Yup.number().required(),
    });

    if (!(await schemaParams.isValid(req.params))) {
      return res.status(400).json({ error: 'Params Validation fails!' });
    }

    if (!(await schemaQuery.isValid(req.query))) {
      return res.status(400).json({ error: 'Query Validation fails!' });
    }

    const { id } = req.params;
    const { canceled_at } = req.query;

    const canceledDate = parseISO(
      format(Number(canceled_at), "yyyy-MM-dd'T'HH:mm:ssxxx")
    );

    const problem = await DeliveryProblem.findByPk(id);

    if (!problem) {
      return res.status(400).json({ message: 'Delivery not found!' });
    }

    const cancel = await Delivery.findByPk(problem.delivery_id, {
      include: [
        {
          model: DeliveryMan,
          as: 'deliveryman',
          attributes: ['id', 'name', 'email'],
        },
        {
          model: Recipient,
          as: 'recipient',
          attributes: [
            'name',
            'street',
            'number',
            'complement',
            'state',
            'city',
            'zip',
          ],
        },
      ],
    });

    if (cancel.canceled_at) {
      return res.status(400).json({ message: 'Delivery is already canceled!' });
    }

    await cancel.update({ canceled_at: canceledDate });

    await Queue.add(CancellationMail.key, {
      cancel,
    });

    return res.json(cancel);
  }
}

export default new DeliveryProblemController();
