import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/refund-policy")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl pb-16">
      <article className="prose prose-slate">
        <h1>Refund Policy</h1>
        <p className="text-sm text-muted-foreground">
          Last updated: January 2025
        </p>

        <h2>No Refund Policy</h2>
        <p>
          All sales are final. We do not provide refunds for any purchases made
          through our Service. By completing a purchase, You acknowledge and
          agree that You will not be entitled to a refund for any reason,
          including but not limited to dissatisfaction with the Service, change
          of mind, or any other circumstance.
        </p>

        <h2>Why We Don't Offer Refunds</h2>
        <p>
          Online courses present unique challenges when it comes to refunds.
          Unlike physical products that can be returned, digital educational
          content cannot be "unused" once accessed. Unfortunately, refund
          policies for online courses are frequently abused, which creates
          significant problems for both course creators and legitimate students.
        </p>

        <h3>Common Abuse Scenarios</h3>
        <p>
          We have found that refund policies for online courses are often
          exploited in ways that harm the learning community:
        </p>

        <ul>
          <li>
            <strong>Content Consumption and Return:</strong> Some individuals
            purchase courses, consume all the content, complete the material,
            and then request refunds. This essentially allows them to access
            premium educational content for free while we bear the costs of
            content creation, hosting, and support.
          </li>
          <li>
            <strong>Unauthorized Sharing:</strong> Refund abuse enables people
            to purchase courses, share access credentials or downloaded
            materials with others, and then request refunds, effectively
            distributing our content without proper compensation.
          </li>
          <li>
            <strong>Fraudulent Claims:</strong> We've encountered cases where
            individuals make false claims about course quality or technical
            issues solely to obtain refunds after they've already benefited from
            the content.
          </li>
          <li>
            <strong>Competitive Intelligence:</strong> Some competitors purchase
            courses to analyze our teaching methods and content structure, then
            request refunds, using our intellectual property without fair
            compensation.
          </li>
        </ul>

        <h3>Impact on Course Quality</h3>
        <p>When refund abuse occurs, it directly impacts our ability to:</p>

        <ul>
          <li>
            Invest in creating high-quality educational content and keeping it
            up-to-date
          </li>
          <li>
            Provide ongoing support and improvements to the course materials
          </li>
          <li>
            Maintain fair pricing for all students who value and respect the
            educational content
          </li>
          <li>
            Support the instructors and team members who work hard to deliver
            valuable learning experiences
          </li>
        </ul>

        <h2>What We Offer Instead</h2>
        <p>
          While we cannot offer refunds, we are committed to ensuring you get
          value from your purchase:
        </p>

        <ul>
          <li>
            <strong>Lifetime Access:</strong> Once you purchase the course, you
            have lifetime access to all current and future content updates at no
            additional cost.
          </li>
          <li>
            <strong>Quality Content:</strong> We work diligently to provide
            comprehensive, well-structured educational materials that deliver
            real value.
          </li>
          <li>
            <strong>Ongoing Support:</strong> We maintain active community
            channels and support systems to help you succeed with the course
            material.
          </li>
          <li>
            <strong>Free Previews:</strong> We provide free previews and
            detailed course descriptions so you can make an informed decision
            before purchasing.
          </li>
        </ul>

        <h2>Making an Informed Decision</h2>
        <p>
          We encourage you to review all available course information, including
          course descriptions, preview content, and student testimonials, before
          making your purchase. If you have any questions about the course
          content or structure, please contact us before purchasing so we can
          help ensure the course is right for you.
        </p>

        <h2>Contact Us</h2>
        <p>
          If you have any questions about this Refund Policy, You can contact
          us:
        </p>
        <p>
          By email:{" "}
          <a href="mailto:webdevcody@gmail.com">webdevcody@gmail.com</a>
        </p>
      </article>
    </div>
  );
}
