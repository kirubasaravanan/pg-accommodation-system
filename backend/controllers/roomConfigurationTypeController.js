const RoomConfigurationType = require('../models/RoomConfigurationType');

const createRoomConfigurationType = async (req, res) => {
  try {
    const {
      name,
      baseSharingCapacity,
      baseRent,
      isConvertible,
      convertedSharingCapacity,
      convertedRent,
      acStatus,
      description,
      categoryName, // Added categoryName
    } = req.body;

    const existingType = await RoomConfigurationType.findOne({ name });
    if (existingType) {
      return res.status(400).json({ message: 'A configuration type with this name already exists.' });
    }

    const newConfigurationType = new RoomConfigurationType({
      name,
      baseSharingCapacity,
      baseRent,
      isConvertible,
      convertedSharingCapacity: isConvertible ? convertedSharingCapacity : undefined,
      convertedRent: isConvertible ? convertedRent : undefined,
      acStatus,
      description,
      categoryName, // Added categoryName
    });

    const savedConfigurationType = await newConfigurationType.save();
    res.status(201).json(savedConfigurationType);
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({ message: messages.join(' ') });
    }
    console.error('Error creating room configuration type:', error);
    res.status(500).json({ message: 'Server error while creating room configuration type.' });
  }
};

const getRoomConfigurationTypes = async (req, res) => {
  try {
    const configurationTypes = await RoomConfigurationType.find({});
    res.status(200).json(configurationTypes);
  } catch (error) {
    console.error('Error fetching room configuration types:', error);
    res.status(500).json({ message: 'Server error while fetching room configuration types.' });
  }
};

const getRoomConfigurationTypeById = async (req, res) => {
  try {
    const configurationType = await RoomConfigurationType.findById(req.params.id);
    if (!configurationType) {
      return res.status(404).json({ message: 'Room configuration type not found.' });
    }
    res.status(200).json(configurationType);
  } catch (error) {
    console.error('Error fetching room configuration type by ID:', error);
    if (error.kind === 'ObjectId') {
        return res.status(404).json({ message: 'Room configuration type not found.' });
    }
    res.status(500).json({ message: 'Server error while fetching room configuration type.' });
  }
};

const updateRoomConfigurationType = async (req, res) => {
  try {
    const {
      name,
      baseSharingCapacity,
      baseRent,
      isConvertible,
      convertedSharingCapacity,
      convertedRent,
      acStatus,
      description,
      categoryName, // Added categoryName
    } = req.body;

    let configurationType = await RoomConfigurationType.findById(req.params.id);

    if (!configurationType) {
      return res.status(404).json({ message: 'Room configuration type not found.' });
    }

    if (name && name !== configurationType.name) {
        const existingType = await RoomConfigurationType.findOne({ name });
        if (existingType) {
            return res.status(400).json({ message: 'A configuration type with this name already exists.' });
        }
    }

    configurationType.name = name || configurationType.name;
    configurationType.baseSharingCapacity = baseSharingCapacity || configurationType.baseSharingCapacity;
    configurationType.baseRent = baseRent || configurationType.baseRent;
    configurationType.isConvertible = typeof isConvertible === 'boolean' ? isConvertible : configurationType.isConvertible;
    
    if (configurationType.isConvertible) {
        configurationType.convertedSharingCapacity = convertedSharingCapacity !== undefined ? convertedSharingCapacity : configurationType.convertedSharingCapacity;
        configurationType.convertedRent = convertedRent !== undefined ? convertedRent : configurationType.convertedRent;
    } else {
        configurationType.convertedSharingCapacity = undefined;
        configurationType.convertedRent = undefined;
    }
    
    configurationType.acStatus = acStatus || configurationType.acStatus;
    configurationType.description = description !== undefined ? description : configurationType.description;
    configurationType.categoryName = categoryName !== undefined ? categoryName : configurationType.categoryName; // Added categoryName

    const updatedConfigurationType = await configurationType.save();
    res.status(200).json(updatedConfigurationType);
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({ message: messages.join(' ') });
    }
    console.error('Error updating room configuration type:', error);
    if (error.kind === 'ObjectId') {
        return res.status(404).json({ message: 'Room configuration type not found.' });
    }
    res.status(500).json({ message: 'Server error while updating room configuration type.' });
  }
};

const deleteRoomConfigurationType = async (req, res) => {
  try {
    const configurationType = await RoomConfigurationType.findById(req.params.id);

    if (!configurationType) {
      return res.status(404).json({ message: 'Room configuration type not found.' });
    }

    await configurationType.deleteOne();

    res.status(200).json({ message: 'Room configuration type deleted successfully.' });
  } catch (error) {
    console.error('Error deleting room configuration type:', error);
    if (error.kind === 'ObjectId') {
        return res.status(404).json({ message: 'Room configuration type not found.' });
    }
    res.status(500).json({ message: 'Server error while deleting room configuration type.' });
  }
};

module.exports = {
    createRoomConfigurationType,
    getRoomConfigurationTypes,
    getRoomConfigurationTypeById,
    updateRoomConfigurationType,
    deleteRoomConfigurationType,
};
