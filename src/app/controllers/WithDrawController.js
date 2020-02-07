import * as Yup from 'yup';
import { parseISO, getHours, startOfDay, endOfDay, format } from 'date-fns';
import { Op } from 'sequelize';

import Deliveryman from '../models/Deliverman';
import Delivery from '../models/Delivery';

class WithDrawController {
  async update(req, res) {
    const MAX_WITHDRAW = 5;

    const schema = Yup.object().shape({
      start_date: Yup.number().required(),
    });

    const schemaParams = Yup.object().shape({
      idDman: Yup.number().required(),
      idOrder: Yup.number().required(),
    });

    if (!(await schema.isValid(req.query))) {
      return res.status(400).json({ error: 'Query Validation fails!' });
    }
    if (!(await schemaParams.isValid(req.params))) {
      return res.status(400).json({ error: 'Params Validation fails!' });
    }

    const { idDman, idOrder } = req.params;

    const deliveryman = await Deliveryman.findByPk(idDman);
    const delivery = await Delivery.findByPk(idOrder);

    if (!deliveryman) {
      return res.status(400).json({ error: 'Deliveryman does not exists!' });
    }

    if (!delivery) {
      return res.status(400).json({ error: 'Order does not exists!' });
    }

    if (delivery.canceled_at) {
      return res.status(400).json({ error: 'Order is already canceled' });
    }

    if (delivery.end_date) {
      return res.status(400).json({ error: 'Order is already delivered' });
    }

    if (delivery.start_date) {
      return res.status(400).json({ error: 'Order is already withdraw' });
    }

    const { start_date } = req.query;

    const datecolect = Number(start_date);
    const dateWitdraw = parseISO(
      format(datecolect, "yyyy-MM-dd'T'HH:mm:ssxxx")
    );
    const withdrawHour = getHours(dateWitdraw);

    if (withdrawHour < 8 || withdrawHour >= 20) {
      return res.status(400).json({
        error: 'The order pick-up date is between 8:00 am to 6:00 pm',
      });
    }

    const deliveries = await Delivery.findAll({
      where: {
        deliveryman_id: idDman,
        canceled_at: null,
        end_date: null,
        start_date: {
          [Op.between]: [startOfDay(dateWitdraw), endOfDay(dateWitdraw)],
        },
      },
    });

    if (deliveries.length >= MAX_WITHDRAW) {
      return res.status(400).json({
        error: `The Deliveryman has already done ${MAX_WITHDRAW} deliveries on the day`,
      });
    }

    await delivery.update({ start_date: dateWitdraw });

    return res.json({ message: 'Withdraw done!' });
  }
}

export default new WithDrawController();
