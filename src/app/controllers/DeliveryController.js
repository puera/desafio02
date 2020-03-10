import * as Yup from 'yup';
import { Op } from 'sequelize';

import Delivery from '../models/Delivery';
import File from '../models/File';
import Recipient from '../models/Recipient';
import Deliveryman from '../models/Deliverman';

import NotificationMail from '../jobs/NotificationMail';
import Queue from '../../lib/Queue';

class DeliveryController {
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
        product: {
          [Op.iLike]: `%${q}%`,
        },
      };
    }

    const { count, rows } = await Delivery.findAndCountAll({
      where: query,
      limit,
      offset: (page - 1) * limit,
      order: [['id', 'ASC']],
      attributes: [
        'id',
        'product',
        'canceled_at',
        'start_date',
        'end_date',
        'status',
      ],
      include: [
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
        {
          model: Deliveryman,
          as: 'deliveryman',
          attributes: ['name', 'email'],
          include: [
            {
              model: File,
              as: 'avatar',
              attributes: ['path', 'url'],
            },
          ],
        },
        {
          model: File,
          as: 'signature',
          attributes: ['name', 'path', 'url'],
        },
      ],
    });
    return res.json({ count, deliveries: rows });
  }

  async show(req, res) {
    const schema = Yup.object().shape({
      id: Yup.number()
        .required()
        .positive()
        .integer(),
    });

    if (!(await schema.isValid(req.params))) {
      return res.status(400).json({ error: 'Validation fails' });
    }

    const { id } = req.params;
    const order = await Delivery.findByPk(id, {
      include: [
        {
          model: File,
          as: 'signature',
          attributes: ['id', 'path', 'url'],
        },
        {
          model: Deliveryman,
          as: 'deliveryman',
          attributes: ['id', 'name', 'email'],
        },
        {
          model: Recipient,
          as: 'recipient',
          attributes: [
            'id',
            'name',
            'street',
            'number',
            'complement',
            'city',
            'state',
            'zip',
          ],
        },
      ],
      attributes: [
        'id',
        'product',
        'canceled_at',
        'start_date',
        'end_date',
        'status',
      ],
    });

    return res.json(order);
  }

  async store(req, res) {
    const schema = Yup.object().shape({
      product: Yup.string().required(),
      recipient_id: Yup.number().required(),
      deliveryman_id: Yup.number().required(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails!' });
    }
    const delivery = await Delivery.create(req.body);
    const deliveryPick = await Delivery.findByPk(delivery.id, {
      include: [
        {
          model: Deliveryman,
          as: 'deliveryman',
          attributes: ['name', 'email'],
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
    await Queue.add(NotificationMail.key, {
      deliveryPick,
    });

    return res.json(delivery);
  }

  async update(req, res) {
    const schema = Yup.object().shape({
      product: Yup.string(),
      recipient_id: Yup.number(),
      deliveryman_id: Yup.number(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails!' });
    }
    const { id } = req.params;
    const { recipient_id, deliveryman_id } = req.body;

    const delivery = await Delivery.findByPk(id, {
      attributes: ['id', 'product'],
      include: [
        {
          model: Deliveryman,
          as: 'deliveryman',
          attributes: ['name', 'email'],
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

    if (!delivery) {
      return res.status(400).json({ message: 'Delivery not found!' });
    }

    if (recipient_id) {
      const recipient = await Recipient.findByPk(recipient_id);

      if (!recipient) {
        return res.status(400).json({ message: 'Recipient not found!' });
      }
    }
    if (deliveryman_id) {
      const deliveryman = await Deliveryman.findByPk(deliveryman_id);

      if (!deliveryman) {
        return res.status(400).json({ message: 'Deliveryman not found!' });
      }
    }

    await delivery.update(req.body);

    return res.json(delivery);
  }

  async delete(req, res) {
    const schema = Yup.object().shape({
      id: Yup.number(),
    });

    if (!(await schema.isValid(req.params))) {
      return res.status(400).json({ error: 'Validation fails!' });
    }
    const { id } = req.params;

    const delivery = await Delivery.findByPk(id);

    if (!delivery) {
      return res.status(400).json({ message: 'Delivery not found!' });
    }
    await delivery.destroy();
    return res.json({ message: 'Delivery deleted!' });
  }
}

export default new DeliveryController();
