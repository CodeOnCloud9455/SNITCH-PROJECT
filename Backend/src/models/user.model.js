import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const addressSchema = new mongoose.Schema({
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    landmark: { type: String, default: "" },
    country: { type: String, default: "India" },
    isDefault: { type: Boolean, default: false },
    tag: { type: String, enum: ["Home", "Work", "Other"], default: "Home" }
}, { timestamps: true });

const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    contact: { type: String, required: false, unique: true, sparse: true },
    password: { 
        type: String, 
        required: function () {
            return !this.googleId;
        }
    },
    fullname: { type: String, required: true },
    role: {
        type: String,
        enum: ["buyer", "seller" ],
        default: "buyer"
    },
    googleId: {
        type: String,
    },
    profilepic: {
        type: String,
        default: ""
    },
    bio: {
        type: String,
        default: ""
    },
    addresses: [addressSchema],
    preferences: {
        emailNotifications: { type: Boolean, default: true },
        smsUpdates: { type: Boolean, default: true },
        twoFactor: { type: Boolean, default: false },
        darkTheme: { type: Boolean, default: true }
    }
}, { timestamps: true });

userSchema.pre("save", async function () {
    if(!this.isModified("password")) return;

    const hash = await bcrypt.hash(this.password, 10);
    this.password = hash;
})

userSchema.methods.comparePassword = async function (password) {
    return await bcrypt.compare(password, this.password);
}

const userModel = mongoose.model('user', userSchema);

export default userModel;   