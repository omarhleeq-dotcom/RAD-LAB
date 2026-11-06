-- Pending independent production-shaped calibration. Never apply this placeholder.
begin read only;do $$begin raise exception 'backup inventory calibration pending; STOP';end$$;rollback;
