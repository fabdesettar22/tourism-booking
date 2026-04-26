export type HotelType = 'HOTEL'|'GUESTHOUSE'|'BED_BREAKFAST'|'HOMESTAY'|'HOSTEL'|'CONDO_HOTEL'|'CAPSULE_HOTEL'|'COUNTRY_HOUSE'|'FARM_STAY'|'INN'|'MOTEL'|'RESORT'|'RIAD'|'LODGE'|'FLOATING';
export type HotelsCount = 'SINGLE'|'MULTIPLE';
export type BookingType = 'INSTANT'|'REQUEST';
export type ContentStatus = 'DRAFT'|'PENDING_REVIEW'|'APPROVED'|'REJECTED';
export type PetsPolicy = 'YES'|'ON_REQUEST'|'NO';
export type ParkingType = 'FREE'|'PAID'|'NO';
export type PricePlanType = 'STANDARD'|'NON_REFUNDABLE'|'WEEKLY';
export type OwnerType = 'INDIVIDUAL'|'BUSINESS';
export type AvailabilityStart = 'ASAP'|'SPECIFIC_DATE';
export type Currency = 'MYR'|'USD'|'EUR'|'SGD'|'AED'|'SAR'|'DZD';
export type RoomUnitType = 'TWIN'|'DOUBLE'|'SINGLE'|'TRIPLE'|'QUAD'|'SUITE'|'JUNIOR_SUITE'|'FAMILY'|'STUDIO'|'DELUXE'|'SUPERIOR'|'CONNECTING'|'PENTHOUSE';
export type BedType = 'SINGLE'|'FULL'|'QUEEN'|'KING'|'BUNK'|'SOFA_BED'|'FUTON';
export interface OnboardingStepsStatus { step0_property_type:boolean; step1_basic_info:boolean; step2_amenities:boolean; step2_services:boolean; step2_description:boolean; step3_rooms:boolean; step4_photos:boolean; step5_pricing:boolean; step6_availability:boolean; step7_final:boolean; }
export interface HotelOnboardingStatus { id:string; hotel_name:string; hotel_type:HotelType; star_rating:string; content_status:ContentStatus; booking_type:BookingType; terms_accepted:boolean; open_immediately:boolean; rooms_count:number; images_count:number; amenities_count:number; completion_pct:number; steps_status:OnboardingStepsStatus; created_at:string; updated_at:string; }
export interface Step0Data { hotel_type:HotelType; hotels_count:HotelsCount; listed_on:string[]; }
export interface Step1Data { hotel_name:string; star_rating:string; is_chain:boolean; chain_name:string; address:string; address_unit:string; country:string; city:string; postal_code:string; latitude:string; longitude:string; has_channel_manager:boolean; channel_manager_name:string; }
export interface Step2ServicesData { breakfast_available:boolean; breakfast_included:boolean; breakfast_price:string; breakfast_currency:Currency; breakfast_types:string[]; parking_available:ParkingType; parking_price:string; parking_price_unit:string; parking_reservation:boolean; parking_location:string; parking_private:boolean; spoken_languages:string[]; checkin_from:string; checkin_until:string; checkout_from:string; checkout_until:string; children_allowed:boolean; pets_policy:PetsPolicy; pets_free:boolean; }
export interface Step2DescriptionData { description_property:string; host_name:string; host_bio:string; description_neighborhood:string; }
export interface BedConfig { type:BedType; count:number; }
export interface OccupancyPrice { guests_count:number; discount_pct:string; final_price:string; is_active:boolean; }
export interface HotelRoomType { id:string; room_unit_type:RoomUnitType; room_count:number; beds:BedConfig[]; max_guests:number; exclude_infants:boolean; area_sqm:string; area_unit:string; smoking_allowed:boolean; bathroom_private:boolean; bathroom_items:string[]; room_amenities:string[]; room_name:RoomUnitType; room_custom_name:string; cost_price_per_night:string; cost_currency:Currency; occupancy_prices:OccupancyPrice[]; content_status:ContentStatus; is_active:boolean; created_at:string; updated_at:string; }
export interface PropertyImage { id:string; image:string; is_main:boolean; order:number; uploaded_at:string; }
export interface HotelAmenity { id:string; name_en:string; name_ar:string; name_fr:string; name_ms:string; category:string; category_display:string; amenity_type:string; icon:string; sort_order:number; }
export interface AmenityGroup { category:string; label:string; items:HotelAmenity[]; }
export interface HotelPricePlan { id:string; plan_type:PricePlanType; plan_type_display:string; is_enabled:boolean; discount_pct:string; min_nights:number; cancellation_free_days:number; created_at:string; }
export interface Step5PricingData { booking_type:BookingType; cancellation_deadline_days:number; cancellation_fee_type:string; accidental_booking_protection:boolean; children_pricing_enabled:boolean; infant_age_from:number; infant_age_to:number; infant_price:string; infant_price_type:string; children_age_from:number; children_age_to:number; children_price:string; children_price_type:string; launch_discount_enabled:boolean; launch_discount_pct:string; launch_discount_bookings:number; launch_discount_days:number; }
export interface Step6AvailabilityData { availability_start:AvailabilityStart; availability_start_date:string|null; availability_window:number; calendar_sync_enabled:boolean; calendar_sync_url:string; allow_long_stays:boolean; max_nights:number; }
export interface Step7FinalData { payment_method:string; invoice_name_type:string; invoice_legal_name:string; invoice_same_address:boolean; invoice_address:string; owner_type:OwnerType; contract_first_name:string; contract_middle_name:string; contract_last_name:string; contract_email:string; contract_phone:string; contract_country:string; contract_address1:string; contract_address2:string; contract_city:string; contract_zip:string; business_legal_name:string; business_country:string; business_address1:string; business_address2:string; business_city:string; business_zip:string; license_confirmed:boolean; terms_accepted:boolean; open_immediately:boolean; }
export type WaitlistSupplierType = 'TRANSPORT'|'RESTAURANT'|'GUIDE'|'ACTIVITY'|'WELLNESS'|'HALAL'|'ENTERTAINMENT'|'SERVICES'|'OTHER';
export interface SupplierWaitlistData { supplier_type:WaitlistSupplierType; full_name:string; company_name:string; sub_type:string; phone:string; email:string; extra_info:Record<string,unknown>; }
