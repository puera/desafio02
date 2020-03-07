import * as Yup from 'yup';
import { Op } from 'sequelize';
import zipCode from 'cep-promise';

import Recipient from '../models/Recipient';

class RecipientController {
  async index(req, res) {
    const { q } = req.query;

    if (q) {
      const recipient = await Recipient.findAll({
        where: {
          name: {
            [Op.iLike]: `%${q}%`,
          },
        },
        attributes: [
          'id',
          'name',
          'street',
          'number',
          'complement',
          'state',
          'city',
          'zip',
        ],
      });
      return res.json(recipient);
    }
    const recipients = await Recipient.findAll({
      attributes: [
        'id',
        'name',
        'street',
        'number',
        'complement',
        'state',
        'city',
        'zip',
      ],
    });
    return res.json(recipients);
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
    const recipient = await Recipient.findByPk(id);

    if (!recipient) {
      return res.status(401).json({ error: 'Recipient does not exist' });
    }

    return res.json(recipient);
  }

  async store(req, res) {
    const schema = Yup.object().shape({
      name: Yup.string().required(),
      number: Yup.string().required(),
      complement: Yup.string().required(),
      zip_code: Yup.string().required(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails!' });
    }
    try {
      const data = await zipCode(req.body.zip_code);
      const { zip = data.cep } = data;
      const { name, number, complement } = req.body;

      const recipient = await Recipient.create({
        name,
        number,
        complement,
        zip,
        ...data,
      });
      return res.json({ recipient });
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  }

  async update(req, res) {
    const schema = Yup.object().shape({
      name: Yup.string(),
      street: Yup.string(),
      number: Yup.string(),
      complement: Yup.string(),
      state: Yup.string(),
      city: Yup.string(),
      zip: Yup.string(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails!' });
    }
    const { id } = req.params;
    const recipientPick = await Recipient.findByPk(id);
    if (!recipientPick) {
      return res.status(400).json({ error: 'Recipient not found!' });
    }
    await recipientPick.update(req.body);

    return res.json({ recipientPick });
  }

  async delete(req, res) {
    const schema = Yup.object().shape({
      id: Yup.number(),
    });

    if (!(await schema.isValid(req.params))) {
      return res.status(400).json({ error: 'Validation fails!' });
    }
    const { id } = req.params;

    const recipient = await Recipient.findByPk(id);
    if (!recipient) {
      return res.status(400).json({ error: 'Recipient not found!' });
    }
    await recipient.destroy();
    return res.json({ message: 'Recipient deleted with sucess!' });
  }
}

export default new RecipientController();
