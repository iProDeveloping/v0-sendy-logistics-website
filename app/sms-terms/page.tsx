export const metadata = {
  title: "SMS Messaging Terms and Conditions | Sendy Logistics",
  description:
    "Terms and conditions for the Smarty SMS group messaging service operated by Sendy Logistics LLC.",
}

export default function SmsTermsPage() {
  return (
    <>
      <section className="pt-32 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <h1 className="font-serif text-4xl sm:text-5xl font-bold text-foreground mb-6 text-center">
            SMS Messaging Terms and Conditions
          </h1>
          <p className="text-muted-foreground text-center mb-4">
            For the Smarty SMS group messaging service, operated by Sendy Logistics LLC.
          </p>
        </div>
      </section>

      <section className="pb-16 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <div className="bg-card border border-border rounded-2xl p-8 sm:p-12">
            <p className="text-muted-foreground mb-8 leading-relaxed">
              These terms govern your use of Smarty SMS, the group messaging service
              operated by Sendy Logistics LLC. By using the service you agree to them.
            </p>

            <h2 className="font-serif text-xl font-bold text-foreground mb-4">
              The service
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-8">
              You create a group by texting #new to +1 858 330 4849. You will receive a
              reply from a different number; that number is your group. Messages you send
              to that number are relayed to the other members of the group. The service
              works entirely by SMS and requires no app or internet connection.
            </p>

            <h2 className="font-serif text-xl font-bold text-foreground mb-4">Consent</h2>
            <p className="text-muted-foreground leading-relaxed mb-8">
              You consent to receive messages either by texting #new yourself, or by
              being added to a group by an existing member using the #add command. In
              either case, the first message you receive from us identifies the group and
              tells you how to opt out. Consent to receive messages is not a condition of
              any purchase.
            </p>

            <h2 className="font-serif text-xl font-bold text-foreground mb-4">
              Message frequency and cost
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-8">
              Message frequency varies and depends on how active your groups are. Message
              and data rates may apply. Sendy Logistics LLC does not charge for this
              service; your mobile carrier&rsquo;s standard rates apply.
            </p>

            <h2 className="font-serif text-xl font-bold text-foreground mb-4">
              Opting out and getting help
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-8">
              Reply STOP at any time to stop all messages, START to resume, or HELP for
              help. Mobile carriers are not liable for delayed or undelivered messages.
            </p>

            <h2 className="font-serif text-xl font-bold text-foreground mb-4">
              Acceptable use
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-8">
              Do not use the service to send unlawful, harassing, abusive, or unsolicited
              commercial messages, to add people to groups against their wishes, or to
              impersonate others. We may remove users or close groups that violate these
              terms.
            </p>

            <h2 className="font-serif text-xl font-bold text-foreground mb-4">
              Availability
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-8">
              The service is provided as is, without warranty. Delivery of messages
              depends on mobile carriers and is not guaranteed.
            </p>

            <h2 className="font-serif text-xl font-bold text-foreground mb-4">Contact</h2>
            <p className="text-muted-foreground leading-relaxed">
              Sendy Logistics LLC. Service number: +1 858 330 4849. Email:{" "}
              <a className="underline" href="mailto:admin@sendylogistics.com">
                admin@sendylogistics.com
              </a>
              .
            </p>

            <div className="mt-12 pt-8 border-t border-border">
              <p className="text-sm text-muted-foreground">Last updated August 2026.</p>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
