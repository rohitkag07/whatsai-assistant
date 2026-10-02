import { PendingAccess,LegacyPendingAccess } from '@/components/auth/PendingAccess';
export default function GuardPage(){return process.env.XEROWA_FIRST_RUN_ENABLED==='1'?<PendingAccess />:<LegacyPendingAccess />;}
