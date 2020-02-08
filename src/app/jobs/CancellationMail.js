import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import Mail from '../../lib/Mail';

class CancellationMail {
  get key() {
    return 'CancellationMail';
  }

  async handle({ data }) {
    const { cancel } = data;
    await Mail.sendMail({
      to: `${cancel.deliveryman.name} <${cancel.deliveryman.email}>`,
      subject: 'Encomenda Cancelada!',
      template: 'cancellation',
      context: {
        deliveryman: cancel.deliveryman.name,
        product: cancel.product,
        client: cancel.recipient.name,
        street: cancel.recipient.street,
        number: cancel.recipient.number,
        complement: cancel.recipient.complement,
        state: cancel.recipient.complement,
        city: cancel.recipient.city,
        zip: cancel.recipient.zip,
        date: format(new Date(), "'dia' dd 'de' MMMM', às' H:mm'h'", {
          locale: ptBR,
        }),
      },
    });
  }
}

export default new CancellationMail();
