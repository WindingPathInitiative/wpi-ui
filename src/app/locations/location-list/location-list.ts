import { Component, OnInit, inject, signal } from '@angular/core';
import { LocationListItemComponent } from '../location-list-item/location-list-item';
import { HubService } from '../../core/hub.service';
import { OrgUnit } from '../../core/models';

@Component({
  selector: 'app-location-list',
  imports: [LocationListItemComponent],
  templateUrl: './location-list.html',
})
export class LocationListComponent implements OnInit {
  private readonly hub = inject(HubService);
  protected readonly orgUnits = signal<OrgUnit[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal(false);

  ngOnInit(): void {
    this.hub.getOrgUnits({}).subscribe({
      next: units => { this.orgUnits.set(units); this.loading.set(false); },
      error: () => { this.loading.set(false); this.error.set(true); },
    });
  }
}
