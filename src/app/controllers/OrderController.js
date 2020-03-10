import * as Yup from 'yup';
import { parseISO, format } from 'date-fns';

import Deliverman from '../models/Deliverman';
import Delivery from '../models/Delivery';
import File from '../models/File';
import Recipient from '../models/Recipient';

class OrderController {
  async index(req, res) {
    const schema = Yup.object().shape({
      page: Yup.number(),
    });

    if (!(await schema.isValid(req.query))) {
      return res.status(400).json({ error: 'Query Validation fails!' });
    }
    const { id } = req.params;
    const { page = 1, limit = 5 } = req.query;

    const deliveries = await Delivery.findAll({
      where: {
        deliveryman_id: id,
        end_date: null,
        canceled_at: null,
      },
      limit,
      offset: (page - 1) * limit,
      order: [['id', 'ASC']],
      attributes: ['id', 'product'],
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
      ],
    });

    return res.json(deliveries);
  }

  async update(req, res) {
    const schema = Yup.object().shape({
      idDman: Yup.number().required(),
      idOrder: Yup.number().required(),
    });

    if (!(await schema.isValid(req.params))) {
      return res.status(400).json({ error: 'Validation fails!' });
    }

    const { idDman, idOrder } = req.params;
    const { end_date } = req.query;

    const deliverman = await Deliverman.findByPk(idDman);
    const delivery = await Delivery.findByPk(idOrder, {
      attributes: ['id', 'product', 'start_date', 'end_date'],
      include: [
        {
          model: Deliverman,
          as: 'deliveryman',
          attributes: ['id', 'name', 'email'],
        },
      ],
    });

    if (!deliverman) {
      return res.status(400).json({ error: 'Deliveryman does not exists!' });
    }

    if (!delivery) {
      return res.status(400).json({ error: 'Order does not exists!' });
    }

    if (!delivery.start_date) {
      return res.status(400).json({ error: 'Order not collected!' });
    }

    if (delivery.canceled_at) {
      return res.status(400).json({ error: 'Order is canceled!' });
    }

    if (delivery.end_date) {
      return res.status(400).json({ error: 'Order is already delivered' });
    }

    const datepick = Number(end_date);
    const deliveredDate = parseISO(
      format(datepick, "yyyy-MM-dd'T'HH:mm:ssxxx")
    );

    const { originalname: name, filename: path } = req.file;

    const file = await File.create({
      name,
      path,
    });

    await delivery.update({
      end_date: deliveredDate,
      signature_id: file.id,
    });

    return res.json(delivery);
  }
}

export default new OrderController();
