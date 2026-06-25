import { Office } from './office';
import { User } from './user';

export interface OrgUnit {
  id: number;
  code: string;
  name: string;
  type: string;
  venueType: string;
  location: string;
  defDoc: string;
  website: string;
  parents: OrgUnit[];
  children: OrgUnit[];
  offices: Office[];
  users: User[];
}
