// Reusable button style classes
export const buttonStyles = {
  // Primary button - main call-to-action
  primary: "inline-flex items-center gap-2 px-6 py-3 bg-black hover:bg-[#DDB071] text-white font-semibold text-base rounded-lg transition-colors",
  
  // Secondary button - secondary actions
  secondary: "inline-flex items-center gap-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-semibold text-base rounded-lg transition-colors",
  
  // Tertiary button - subtle actions
  tertiary: "inline-flex items-center gap-2 px-4 py-2 bg-stone-100 hover:bg-stone-200 text-black dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white font-medium text-base rounded-lg transition-colors",
  
  // Danger button - destructive actions
  danger: "inline-flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold text-base rounded-lg transition-colors",
  
  // Small variants
  primarySmall: "inline-flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-[#DDB071] text-white font-medium text-sm rounded-lg transition-colors",
  primarySmallDisabled: "inline-flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 font-medium text-sm rounded-lg cursor-not-allowed",
  secondarySmall: "inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-medium text-sm rounded-lg transition-colors",
  tertiarySmall: "inline-flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 font-medium text-sm rounded-lg transition-colors",
  dangerSmall: "inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium text-sm rounded-lg transition-colors",
  
  // Extra small variants (16px height)
  primaryExtraSmall: "inline-flex items-center gap-1 px-1.5 py-0 bg-black hover:bg-[#DDB071] text-white font-medium text-[11px] rounded transition-colors h-5",
  secondaryExtraSmall: "inline-flex items-center gap-1 px-1.5 py-0 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-medium text-[11px] rounded transition-colors h-5",
  tertiaryExtraSmall: "inline-flex items-center gap-1 px-1.5 py-0 text-gray-900 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 font-medium text-[11px] rounded transition-colors h-5",
  dangerExtraSmall: "inline-flex items-center gap-1 px-1.5 py-0 bg-red-600 hover:bg-red-700 text-white font-medium text-[11px] rounded transition-colors h-5",
  
  // Navigation tab buttons
  navTabActive: "text-sm transition-colors text-gray-900 dark:text-white font-bold",
  navTabInactive: "text-sm transition-colors text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200",
  
  // Link styles
  link: "text-base text-black dark:text-white hover:text-gray-600 dark:hover:text-gray-300 transition-colors underline decoration-dotted",
  linkSmall: "text-sm text-black dark:text-white hover:text-gray-600 dark:hover:text-gray-300 transition-colors underline decoration-dotted",
};

// Helper function to combine button styles with custom classes
export const getButtonClass = (variant: keyof typeof buttonStyles, customClasses?: string) => {
  return `${buttonStyles[variant]} ${customClasses || ''}`.trim();
};
