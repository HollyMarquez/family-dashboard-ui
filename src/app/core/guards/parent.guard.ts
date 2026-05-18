import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { FamilyService } from '../services/family.service';

export const parentGuard: CanActivateFn = () => {
  const family = inject(FamilyService);
  const router = inject(Router);
  if (family.isParent()) return true;
  return router.createUrlTree(['/dashboard']);
};
