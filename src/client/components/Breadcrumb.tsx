import { Link } from 'react-router-dom';
import { ClientRouteTypes } from '../constants/client.routes';

export interface BreadcrumbProps {
  route: ClientRouteTypes;
  previousPage: string;
  currentPage: string;
}

const Breadcrumb: React.FC<BreadcrumbProps> = ({ route, previousPage, currentPage }) => {
  return (
    <nav className="breadcrumb" aria-label="Breadcrumb">
      <Link
        className="breadcrumb-link"
        to={route as unknown as string}
        data-testid="breadcrumb-tickets"
      >
        {previousPage}
      </Link>
      <span className="breadcrumb-sep" aria-hidden="true">
        /
      </span>
      <span className="breadcrumb-current" aria-current="page">
        {currentPage}
      </span>
    </nav>
  );
};

export default Breadcrumb;
