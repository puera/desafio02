import { Op } from 'sequelize';

import Delivery from '../models/Delivery';
import File from '../models/File';
import Recipient from '../models/Recipient';

class DeliveriesController {
  async index(req, res) {
    const { id } = req.params;
    const { page = 1, limit = 5 } = req.query;

    const delivery = await Delivery.findAll({
      where: {
        deliveryman_id: id,
        end_date: {
          [Op.ne]: null,
        },
      },
      attributes: ['id', 'product', 'start_date', 'end_date'],
      order: [['id', 'ASC']],
      limit,
      offset: (page - 1) * limit,
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
    return res.json(delivery);
  }
}

export default new DeliveriesController();
