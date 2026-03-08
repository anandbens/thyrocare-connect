// Database-driven LabTest type matching the lab_tests table

export interface ParamGroup {
  group: string;
  count: number;
  tests: string[];
}

export interface LabTest {
  id: string;
  name: string;
  test_code: string | null;
  description: string | null;
  category_id: string | null;
  parameters: number | null;
  parameters_list: string[] | null;
  parameters_grouped: ParamGroup[] | null;
  price: number;
  original_price: number;
  is_popular: boolean | null;
  turnaround: string | null;
  fasting_required: boolean | null;
  sample_type: string | null;
  is_active: boolean | null;
  test_categories?: { name: string; id: string } | null;
}

export interface TestCategory {
  id: string;
  name: string;
  icon: string | null;
  sort_order: number | null;
  is_active: boolean | null;
}
