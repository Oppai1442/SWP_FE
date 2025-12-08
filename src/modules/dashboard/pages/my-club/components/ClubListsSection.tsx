import type { ComponentProps } from 'react';
import ClubsTableSection from './ClubsTableSection';
import CreationRequestsSection from './CreationRequestsSection';

type ClubsTableProps = ComponentProps<typeof ClubsTableSection>;
type CreationRequestsProps = ComponentProps<typeof CreationRequestsSection>;

interface ClubListsSectionProps {
  clubsTableProps: ClubsTableProps;
  creationRequestProps: CreationRequestsProps;
}

const ClubListsSection = ({ clubsTableProps, creationRequestProps }: ClubListsSectionProps) => (
  <section className="mt-8 grid gap-6 lg:grid-cols-3">
    <ClubsTableSection {...clubsTableProps} />
    <CreationRequestsSection {...creationRequestProps} />
  </section>
);

export default ClubListsSection;
