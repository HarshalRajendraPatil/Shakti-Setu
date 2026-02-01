// Curated legal helplines and resources for women in India (no DB – static data)
const RESOURCES = {
  emergency: {
    title: 'Emergency & Immediate Help',
    titleHi: 'आपातकालीन सहायता',
    items: [
      { name: 'Police', nameHi: 'पुलिस', phone: '100', description: 'Emergency police assistance', url: '' },
      { name: 'Women Helpline (24/7)', nameHi: 'महिला हेल्पलाइन (24/7)', phone: '181', description: 'All India women helpline – support and counselling', url: '' },
      { name: 'National Emergency', nameHi: 'राष्ट्रीय आपातकाल', phone: '112', description: 'Single number for police, fire, ambulance', url: '' },
      { name: 'Child Helpline', nameHi: 'बाल हेल्पलाइन', phone: '1098', description: 'For children in distress', url: '' },
    ],
  },
  national: {
    title: 'National Helplines & Commissions',
    titleHi: 'राष्ट्रीय हेल्पलाइन और आयोग',
    items: [
      { name: 'National Commission for Women (NCW)', nameHi: 'राष्ट्रीय महिला आयोग', phone: '011-26942369', description: 'Complaints and support for women', url: 'https://ncw.nic.in' },
      { name: 'National Legal Services Authority (NALSA)', nameHi: 'राष्ट्रीय विधिक सेवा प्राधिकरण', phone: '011-23382778', description: 'Free legal aid for eligible persons', url: 'https://nalsa.gov.in' },
      { name: 'Ministry of Women & Child Development', nameHi: 'महिला एवं बाल विकास मंत्रालय', phone: '', description: 'Government schemes and policies', url: 'https://wcd.nic.in' },
      { name: 'One Stop Centre (Sakhi)', nameHi: 'वन स्टॉप सेंटर (सखी)', phone: '181', description: 'Emergency support, medical, legal, counselling', url: 'https://wcd.nic.in/schemes/one-stop-centre-scheme' },
    ],
  },
  legalAid: {
    title: 'Legal Aid & Support',
    titleHi: 'कानूनी सहायता',
    items: [
      { name: 'NALSA – Legal Aid', nameHi: 'NALSA – कानूनी सहायता', phone: '', description: 'Free legal services; find your State Legal Services Authority', url: 'https://nalsa.gov.in/contact' },
      { name: 'District Legal Services Authority', nameHi: 'जिला विधिक सेवा प्राधिकरण', phone: '', description: 'Contact your district DLSA for local legal aid', url: '' },
      { name: 'Supreme Court Legal Services Committee', nameHi: 'सर्वोच्च न्यायालय विधिक सेवा समिति', phone: '', description: 'Legal aid for Supreme Court matters', url: 'https://main.sci.gov.in/legal-services' },
    ],
  },
  usefulLinks: {
    title: 'Useful Links',
    titleHi: 'उपयोगी लिंक',
    items: [
      { name: 'NCW – Complaints', nameHi: 'NCW – शिकायत', description: 'Lodge a complaint with NCW', url: 'https://ncw.nic.in/online-complaint' },
      { name: 'Digital India – Women Safety', nameHi: 'डिजिटल इंडिया – महिला सुरक्षा', description: 'Government initiatives for women safety', url: 'https://www.digitalindia.gov.in' },
      { name: 'Bharat ke Veer', nameHi: 'भारत के वीर', description: 'Support for families of martyrs', url: 'https://bharatkeveer.gov.in' },
    ],
  },
};

exports.getResources = async (req, res) => {
  try {
    res.json({
      success: true,
      resources: RESOURCES,
    });
  } catch (error) {
    console.error('Get resources error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
