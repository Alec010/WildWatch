/**
 * Office Utilities
 * Maps office codes to their full names
 */

export const OFFICE_NAME_MAP: { [key: string]: string } = {
  'OP': 'Office of the President',
  'VPAA': 'Office of the Vice President for Academic Affairs',
  'VPA': 'Office of the Vice President for Administration',
  'VPF': 'Office of the Vice President for Finance and Treasurer',
  'HR': 'Human Resources Office',
  'FO': 'Finance Office',
  'MIS': 'Management Information Systems Office',
  'MPO': 'Marketing and Promotions Office',
  'OAS': 'Office of Admissions and Scholarships',
  'SSO': 'Student Success Office',
  'TSG': 'Technical Service Group'
};

/**
 * Get the full office name from the office code
 * @param officeCode - The office code (e.g., 'FO', 'HR')
 * @returns The full office name or the original code if not found
 */
export const getOfficeFullName = (officeCode?: string): string => {
  if (!officeCode) return "Office of the Vice President for Administration";
  return OFFICE_NAME_MAP[officeCode] || officeCode;
};

/**
 * Get the office acronym from the full name
 * @param fullName - The full office name
 * @returns The office code/acronym or the original name if not found
 */
export const getOfficeAcronym = (fullName?: string): string => {
  if (!fullName) return "";
  
  const entry = Object.entries(OFFICE_NAME_MAP).find(
    ([_, name]) => name === fullName
  );
  
  return entry ? entry[0] : fullName;
};

