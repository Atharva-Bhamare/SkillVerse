
export const buildCompanyResponse = (company) => {
    if (!company) {
      return null;
    }
  
    return {
      id: company._id?.toString(),
      name: company.name,
      description: company.description,
      industry: company.industry,
      website: company.website,
      location: company.location,
      logo: company.logo,
      contactEmail: company.contactEmail,
      contactPhone: company.contactPhone,
      createdBy: company.createdBy?._id
        ? company.createdBy._id.toString()
        : company.createdBy?.toString(),
      isActive: company.isActive,
      createdAt: company.createdAt,
      updatedAt: company.updatedAt,
    };
  };
  
  export const buildCompanyListResponse = (companies) => {
    return companies.map(buildCompanyResponse);
  };
  