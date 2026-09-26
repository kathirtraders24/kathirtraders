import { Component, signal, ChangeDetectionStrategy, inject, OnInit, viewChild, HostListener } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { MatBadgeModule } from '@angular/material/badge';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { AlertService } from '../services/alert.service';
import { ThemeService } from '../services/theme.service';
import { GlobalSearchComponent } from '../../shared/components/global-search/global-search.component';
import { routeFade } from '../animations/route-animations';

interface NavItem {
  label: string;
  icon: string;
  route: string;
}

@Component({
  selector: 'app-layout-shell',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatSidenavModule,
    MatToolbarModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatTabsModule,
    MatBadgeModule,
    MatMenuModule,
    MatTooltipModule,
    GlobalSearchComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [routeFade],
  templateUrl: './layout-shell.component.html',
  styleUrl: './layout-shell.component.scss',
})
export class LayoutShellComponent implements OnInit {
  private breakpoints = inject(BreakpointObserver);
  private router = inject(Router);
  readonly alertService = inject(AlertService);
  readonly themeService = inject(ThemeService);

  readonly search = viewChild(GlobalSearchComponent);

  sidenavOpen = signal(false);
  isMobile = signal(false);
  // Changes on every navigation so the route-transition animation replays.
  routeState = signal('');

  navItems: NavItem[] = [
    { label: 'Dashboard', icon: 'dashboard', route: '/dashboard' },
    { label: 'Inventory', icon: 'inventory_2', route: '/inventory' },
    { label: 'Sales', icon: 'point_of_sale', route: '/sales' },
    { label: 'Invoice', icon: 'shopping_cart', route: '/purchases' },
    { label: 'Orders', icon: 'receipt_long', route: '/purchases/orders' },
    { label: 'Customers', icon: 'people', route: '/customers' },
    { label: 'Suppliers', icon: 'local_shipping', route: '/suppliers' },
    { label: 'Estimations', icon: 'request_quote', route: '/estimations' },
    { label: 'Reports', icon: 'bar_chart', route: '/reports' },
  ];

  ngOnInit(): void {
    this.alertService.refresh();
    this.breakpoints.observe([Breakpoints.Handset, Breakpoints.Small]).subscribe((state) => {
      this.isMobile.set(state.matches);
      this.sidenavOpen.set(!state.matches ? this.sidenavOpen() : false);
    });
    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe((e) => this.routeState.set(e.urlAfterRedirects));
  }

  toggleSidenav(): void {
    this.sidenavOpen.update((v) => !v);
  }

  closeSidenav(): void {
    this.sidenavOpen.set(false);
  }

  closeSidenavOnMobile(): void {
    if (this.isMobile()) {
      this.sidenavOpen.set(false);
    }
  }

  toggleTheme(): void {
    this.themeService.toggle();
  }

  @HostListener('document:keydown', ['$event'])
  handleShortcut(event: KeyboardEvent): void {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      this.search()?.focus();
      return;
    }
    if (event.altKey && event.key.toLowerCase() === 'n') {
      event.preventDefault();
      this.router.navigateByUrl('/sales/new');
      return;
    }
    if (event.altKey && event.key.toLowerCase() === 'e') {
      event.preventDefault();
      this.router.navigateByUrl('/estimations');
    }
  }
}
