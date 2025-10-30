-- Modify the handle_new_user function to add default categories
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Insert profile
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  
  -- Insert default categories for students
  INSERT INTO public.user_categories (user_id, name)
  VALUES 
    (NEW.id, 'Food'),
    (NEW.id, 'Transport'),
    (NEW.id, 'Stationery'),
    (NEW.id, 'Fees'),
    (NEW.id, 'Entertainment'),
    (NEW.id, 'Rent/Hostel');
  
  RETURN NEW;
END;
$function$;