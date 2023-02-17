// // Velo API Reference: https://www.wix.com/velo/reference/api-overview/introduction
// import wixData from 'wix-data';
// import { currentMember } from 'wix-members';

// $w.onReady(function () {
//             wixData.query("Coach").find()

//                 .then((results) => {
//                     console.log(results.items);
//                 });

//             currentMember.getMember()
//                 .then((member) => {
//                     const id = member._id;
//                     const fullName = `${member.contactDetails.firstName} ${member.contactDetails.lastName}`;
//                     const addressInfo = `${member.contactDetails.addresses}`;
//                     const phone = `${member.contactDetails.phones}`
//                     // return member;
//                     console.log(id);
//                     console.log(fullName);
//                     console.log(member);
//                     console.log(addressInfo);
//                     console.log(phone);

//                     //   })
//                     //   .catch((error) => {
//                     //     console.error(error);
//                     //   });

//                 })
// })

//             export function myGetCurrentMemberFunction(options) {
//                 return currentMember.getMember(options)
//                     .then((member) => {
//                         const memberId = member._id;
//                         const fullName = `${member.contactDetails.firstName} ${member.contactDetails.lastName}`;
//                         const memberProfilePage = `https://yoursite.com/profile/${member.profile.slug}/profile`;

//                         return member

//                     })
//                     .catch((error) => {
//                         console.error(error);
//                     })
//             }