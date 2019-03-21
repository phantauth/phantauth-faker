
const MD5 = require('crypto-js/md5');
const express = require('express');
const app = express();
const port = process.env.PHANTAUTH_FAKER_PORT || 3000;

var globalFaker = require('faker');

function parseName(req) {
    return newName(req.params.name);
}

function newName(input) {
    function normalize(input) {
        var idx = input ? input.indexOf(';') : -1
    
        var flags = idx < 0 ? null : idx + 1 > input.length ? null : input.substring(idx + 1);
        var basePart = idx < 0 ? input : idx == 0 ? null : input.substring(0, idx);
        var base = (basePart ? basePart : globalFaker.internet.userName()).toLowerCase().replace(' ', '.');
        var subject = base + ((flags != null && flags != "") ? (";" + flags) : "");
    
        // base = normalized input before ';', flags = flags after ';', subject = normalized input
    
        return {"subject": subject, "base": base, "flags": flags}
    }
    
    function base2name(base) {
        var idx = base.indexOf('@');
    
        var mailbox = idx < 0 ? base : idx == 0 ? null : base.slice(0,idx);
        idx = mailbox.indexOf('+');
        var mailtag = idx < 0 ? mailbox : mailbox.slice(idx + 1);
        return  mailtag.split('.').map(v => v.charAt(0).toUpperCase() + v.slice(1)).join(' ');
    }

    var name = normalize(input);
    name.name = base2name(name.base);

    var md5 = MD5(name.base);
    var faker = require('faker');
    faker.seed(md5.words[0]);

    name.hash = md5.toString();
    name.faker = faker;

    return name;
}

function newUser(name) {
    var faker = name.faker;

    var givenName = faker.name.firstName();
    var familyName = faker.name.lastName();
    var street = faker.address.streetAddress()
    var city = faker.address.city();
    var zip = faker.address.zipCode();

    return {
        "sub": name.subject,
        "name": givenName + ' ' + familyName,
        "given_name": givenName,
        "family_name": familyName,
        "preferred_username": (givenName.charAt(0) + familyName).toLowerCase(),
        "nickname": givenName,
        "birthdate": faker.date.past(100).toISOString().slice(0,10),
        "locale": faker.random.locale(),
        "email": faker.internet.email(),
        "email_verified": faker.random.boolean(),
        "phone_number": faker.phone.phoneNumber(),
        "phone_number_verified": faker.random.boolean(),
        "password": faker.internet.password(),
        "picture": faker.internet.avatar(),
        "address": {
            "postal_code": zip,
            "locality": city,
            "country": faker.address.country(),
            "region": faker.address.state(),
            "street_address": street,
            "formatted": street + ' ' + city + ' ' + zip
        }
    };
}

function newTeam(name) {
    return {
        "sub": name.subject,
        "name": name.name,
        "logo": `https://www.gravatar.com/avatar/${name.hash}?s=256&d=identicon`,
        "members": Array(8).fill().map(() => newUser(newName(name.faker.internet.userName())))
    };
}

app.get("/api/user/:name?", (req, res) => {
    res.json(newUser(parseName(req)));
});

app.get("/api/team/:name?", (req, res) => {
    res.json(newTeam(parseName(req)));
});

app.use(express.static('.'))

app.listen(port, () => console.log(`Listening on port ${port}!`))
