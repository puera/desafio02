import * as Yup from 'yup';
import Deliverman from '../models/Deliverman';
import File from '../models/File';

class DelivermanController {
  async index(req, res) {
    const delivermans = await Deliverman.findAll({
      attributes: ['id', 'name', 'email'],
      include: [
        { model: File, as: 'avatar', attributes: ['name', 'path', 'url'] },
      ],
    });

    return res.json(delivermans);
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
