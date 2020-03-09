import * as Yup from 'yup';
import { Op } from 'sequelize';
import Deliverman from '../models/Deliverman';
import File from '../models/File';

class DelivermanController {
  async index(req, res) {
    const { q } = req.query;

    if (q) {
      const deliveryman = await Deliverman.findAll({
        where: {
          name: {
            [Op.iLike]: `%${q}%`,
          },
        },
        order: [['id', 'ASC']],
        attributes: ['id', 'name', 'email'],
        include: [
          { model: File, as: 'avatar', attributes: ['name', 'path', 'url'] },
        ],
      });
      return res.json(deliveryman);
    }
    const delivermans = await Deliverman.findAll({
      attributes: ['id', 'name', 'email'],
      order: [['id', 'ASC']],
      include: [
        { model: File, as: 'avatar', attributes: ['name', 'path', 'url'] },
      ],
    });

    return res.json(delivermans);
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
    const deliveryman = await Deliverman.findByPk(id, {
      include: [
        {
          model: File,
          as: 'avatar',
          attributes: ['id', 'path', 'url'],
        },
      ],
      attributes: ['id', 'name', 'email'],
    });

    return res.json(deliveryman);
  }

  async store(req, res) {
    const schema = Yup.object().shape({
      name: Yup.string().required(),
      email: Yup.string()
        .email()
        .required(),
      avatar_id: Yup.number(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails!' });
    }

    const userExists = await Deliverman.findOne({
      where: { email: req.body.email },
    });

    if (userExists) {
      return res.status(400).json({ error: 'User already exists.' });
    }
    const { id, name, email, avatar_id } = await Deliverman.create(req.body);

    return res.json({ id, name, email, avatar_id });
  }

  async update(req, res) {
    const schema = Yup.object().shape({
      name: Yup.string(),
      email: Yup.string().email(),
      avatar_id: Yup.number(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails!' });
    }

    const { email } = req.body;

    const deliverman = await Deliverman.findByPk(req.params.id);

    if (email && email !== deliverman.email) {
      const userExists = await Deliverman.findOne({ where: { email } });

      if (userExists) {
        return res.status(400).json({ error: 'User already exists.' });
      }
    }

    const { id, name, avatar_id } = await deliverman.update(req.body);

    return res.json({
      id,
      name,
      email,
      avatar_id,
    });
  }

  async delete(req, res) {
    const schema = Yup.object().shape({
      id: Yup.number(),
    });

    if (!(await schema.isValid(req.params))) {
      return res.status(400).json({ error: 'Validation fails!' });
    }
    const deliverman = await Deliverman.findOne({
      where: { id: req.params.id },
    });

    if (!deliverman) {
      return res.status(400).json({ error: 'The user do not exists!' });
    }

    await deliverman.destroy();

    return res.json({ message: 'User deleted!' });
  }
}

export default new DelivermanController();
