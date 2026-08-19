export const metadata = {
  title: "SMS Messaging Privacy Policy | Sendy Logistics",
  description:
    "Privacy policy for the Smarty SMS group messaging service operated by Sendy Logistics LLC.",
}

export default function SmsPrivacyPage() {
  return (
    <>
      <section className="pt-32 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <h1 className="font-serif text-4xl sm:text-5xl font-bold text-foreground mb-6 text-center">
            SMS Messaging Privacy Policy
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
              Sendy Logistics LLC operates Smarty SMS, an SMS-only group messaging
              service. This policy explains what we collect when you use it and how we
              use it. The service works entirely by text message; there is no app and no
              account to create.
            </p>

            <h2 className="font-serif text-xl font-bold text-foreground mb-4">
              What we collect
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-8">
              Your mobile phone number. A display name, only if you choose to set one
              using the #me command. The content of messages you send to our numbers, so
              that we can relay them to the other members of your group. Delivery records
              such as time, destination, and carrier result, which we use for
              troubleshooting.
            </p>

            <h2 className="font-serif text-xl font-bold text-foreground mb-4">
              How we use it
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-8">
              Your phone number and messages are used solely to operate the group chat:
              to deliver your messages to the other members of groups you belong to, and
              to respond to the commands you send. We do not send marketing or
              promotional messages through this service.
            </p>

            <h2 className="font-serif text-xl font-bold text-foreground mb-4">
              Sharing your information
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-8">
              No mobile information is sold, rented, or shared with third parties or
              affiliates for marketing or promotional purposes. No mobile information is
              shared with third parties for their own purposes of any kind. Text
              messaging originator opt-in data and consent are never shared with any
              third party. We share data only with our telecommunications provider, for
              the sole purpose of transmitting your messages, and where required by law.
            </p>

            <h2 className="font-serif text-xl font-bold text-foreground mb-4">
              Who can see your messages
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-8">
              Messages you send to a group number are relayed to every current member of
              that group, along with your display name. Your phone number is visible to
              members of your group through the #members command. Only people in your
              group receive your messages.
            </p>

            <h2 className="font-serif text-xl font-bold text-foreground mb-4">
              Opting out
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-8">
              Reply STOP to any of our numbers at any time. You will be removed from your
              groups and we will send you no further messages. Reply START to opt back
              in, or HELP for assistance. Message and data rates may apply, and message
              frequency varies.
            </p>

            <h2 className="font-serif text-xl font-bold text-foreground mb-4">
              Retention and deletion
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-8">
              Group membership and delivery records are retained while your group is
              active. To have your data deleted, reply STOP and then contact us at the
              address below.
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
