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
        date: format(new Date(), "'dia' dd 'de' MMMM', às' H:mm'h'", {
          locale: ptBR,
        }),
        state: deliveryPick.recipient.state,
      },
    });
  }
}

export default new NotificationMail();
