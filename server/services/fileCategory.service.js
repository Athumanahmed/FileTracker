import * as fileCategoryRepository from "../repositories/fileCategory.repository.js";

const sanitize = (category) => ({
  id: category.id,
  name: category.name,
  code: category.code,
  description: category.description,
  parentId: category.parentId,
  defaultRetentionYears: category.defaultRetentionYears,
});

/** Powers the registration form's classification dropdown. */
export const listFileCategories = async () => {
  const categories = await fileCategoryRepository.findMany();
  return categories.map(sanitize);
};
