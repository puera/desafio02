import { Op } from 'sequelize';

import Delivery from '../models/Delivery';
import File from '../models/File';
import Recipient from '../models/Recipient';

class DeliveriesController {
  async index(req, res) {
    const { id } = req.params;
    const { page = 1, limit = 5 } = req.query;

    const { count, rows } = await Delivery.findAndCountAll({
      where: {
        deliveryman_id: id,
        end_date: {
          [Op.ne]: null,
        },
      },
      limit,
      offset: (page - 1) * limit,
      attributes: [
        'id',
        'product',
        'start_date',
        'end_date',
        'createdAt',
        'status',
      ],
      order: [['id', 'ASC']],
      include: [
        {
          model: File,
          as: 'signature',
          attributes: ['name', 'path', 'url'],
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
    return res.json({ count, deliveries: rows });
  }
}

export default new DeliveriesController();
