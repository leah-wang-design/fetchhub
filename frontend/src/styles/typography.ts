// Reusable typography style classes based on homepage design
export const typography = {
  // Headings
  h1: "text-4xl font-bold text-black dark:text-white font-heading",
  h2: "text-2xl font-bold text-black dark:text-white font-heading",
  h3: "text-xl font-semibold text-black dark:text-white font-heading",
  h4: "text-lg font-semibold text-black dark:text-white font-heading",
  h5: "text-base font-semibold text-black dark:text-white font-heading",
  // Body text variants
  body: "text-base text-gray-700 dark:!text-gray-300",
  bodyLarge: "text-xl text-gray-700 dark:text-gray-400",
  bodySmall: "text-sm text-gray-700 dark:text-gray-400",
  bodyExtraSmall: "text-xs text-gray-700 dark:text-gray-400",
  bodyTiny: "text-[11px] text-gray-600 dark:text-gray-400",
  
  // Links
  link: "text-blue-600 dark:text-blue-400 hover:underline",
  linkBlack: "text-black dark:text-blue-400 hover:underline font-medium",
  
  // Specialized text
  label: "text-xs font-medium text-gray-700 dark:text-gray-300",
  caption: "text-xs text-gray-500 dark:text-gray-400",
  timestamp: "text-sm text-gray-500 dark:text-gray-400",
  
  // State colors
  error: "text-red-600 dark:text-red-400",
  success: "text-green-600 dark:text-green-400",
  warning: "text-amber-600 dark:text-amber-400",
  muted: "text-gray-600 dark:text-gray-400",
};

// Helper function to combine typography styles with custom classes
export const getTypographyClass = (variant: keyof typeof typography, customClasses?: string) => {
  return `${typography[variant]} ${customClasses || ''}`.trim();
};
