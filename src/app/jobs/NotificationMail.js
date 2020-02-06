import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import Mail from '../../lib/Mail';

class NotificationMail {
  get key() {
    return 'NotificationMail';
  }

  async handle({ data }) {
    const { deliveryPick } = data;
    await Mail.sendMail({
      to: `${deliveryPick.deliveryman.name} <${deliveryPick.deliveryman.email}>`,
      subject: 'Encomenda Cadastrada',
      template: 'notification',
      context: {
        deliveryman: deliveryPick.deliveryman.name,
        product: deliveryPick.product,
        client: deliveryPick.recipient.name,
        street: deliveryPick.recipient.street,
        number: deliveryPick.recipient.number,
        complement: deliveryPick.recipient.complement,
        state: deliveryPick.recipient.complement,
        city: deliveryPick.recipient.city,
        zip: deliveryPick.recipient.zip,
        date: format(new Date(), "'dia' dd 'de' MMMM', às' H:mm'h'", {
          locale: ptBR,
        }),
      },
    });
  }
}

export default new NotificationMail();
