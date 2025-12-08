import type { ComponentProps } from 'react';
import JoinedClubsSection from './JoinedClubsSection';
import JoinHistorySection from './JoinHistorySection';

type JoinedClubsProps = ComponentProps<typeof JoinedClubsSection>;
type JoinHistoryProps = ComponentProps<typeof JoinHistorySection>;

interface MembershipOverviewSectionProps {
  joinedProps: JoinedClubsProps;
  historyProps: JoinHistoryProps;
}

const MembershipOverviewSection = ({ joinedProps, historyProps }: MembershipOverviewSectionProps) => (
  <section className="mt-8 grid gap-6 lg:grid-cols-2">
    <JoinedClubsSection {...joinedProps} />
    <JoinHistorySection {...historyProps} />
  </section>
);

export default MembershipOverviewSection;
